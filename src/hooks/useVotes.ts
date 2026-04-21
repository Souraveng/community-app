import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export type VoteType = 1 | -1 | null;

export function useVotes(postId: string) {
  const { user } = useAuth();
  const [userVote, setUserVote] = useState<VoteType>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid && postId) {
      fetchUserVote();
    } else {
      setLoading(false);
    }
  }, [user?.uid, postId]);

  const fetchUserVote = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('post_votes')
        .select('vote_type')
        .eq('post_id', postId)
        .eq('user_id', user?.uid)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setUserVote(data ? (data.vote_type as VoteType) : null);
    } catch (err) {
      console.error('Error fetching user vote:', err);
    } finally {
      setLoading(false);
    }
  };

  const vote = async (type: 1 | -1) => {
    if (!user?.uid) return false;

    // Calculate the increment/decrement for the post's counter
    let delta = 0;
    const newVote = userVote === type ? null : type;

    if (userVote === null) {
      // First time voting
      delta = type;
    } else if (userVote === type) {
      // Removing existing vote
      delta = -type;
    } else {
      // Switching votes (from up to down or vice versa)
      delta = type * 2;
    }

    try {
      // 1. Update post_votes table
      if (newVote === null) {
        await supabase
          .from('post_votes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.uid);
      } else {
        await supabase
          .from('post_votes')
          .upsert({
            post_id: postId,
            user_id: user.uid,
            vote_type: newVote
          });
      }

      // 2. Update the aggregate count in posts table
      // We use the 'upvotes' column to store the net SCORE (Upvotes - Downvotes)
      const { data: postData } = await supabase
        .from('posts')
        .select('upvotes')
        .eq('id', postId)
        .single();
      
      const currentScore = postData?.upvotes || 0;
      const finalScore = currentScore + delta;
      
      await supabase
        .from('posts')
        .update({ upvotes: finalScore })
        .eq('id', postId);

      setUserVote(newVote);
      return true;
    } catch (err) {
      console.error('Error submitting vote:', err);
      return false;
    }
  };

  return { userVote, vote, loading };
}

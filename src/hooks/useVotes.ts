import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export type VoteType = 1 | -1 | null;

export function useVotes(postId: string) {
  const { user } = useAuth();
  const [userVote, setUserVote] = useState<VoteType>(null);
  const [counts, setCounts] = useState({ upvoteCount: 0, downvoteCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (postId) {
      fetchData();
    }
  }, [user?.uid, postId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch user's personal vote
      if (user?.uid) {
        const { data: voteData, error: voteError } = await supabase
          .from('post_votes')
          .select('vote_type')
          .eq('post_id', postId)
          .eq('user_id', user.uid)
          .single();

        if (voteError && voteError.code !== 'PGRST116') throw voteError;
        setUserVote(voteData ? (voteData.vote_type as VoteType) : null);
      }

      // 2. Fetch aggregate counts from the post itself
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('upvote_count, downvote_count')
        .eq('id', postId)
        .single();

      if (postError) throw postError;
      setCounts({
        upvoteCount: postData?.upvote_count || 0,
        downvoteCount: postData?.downvote_count || 0
      });

    } catch (err) {
      console.error('Error fetching votes data:', err);
    } finally {
      setLoading(false);
    }
  };

  const vote = async (type: 1 | -1) => {
    if (!user?.uid) return false;

    // Toggle: if clicking same type, we send 0 (remove) to RPC
    const targetVote = userVote === type ? 0 : type;

    try {
      // Call Atomic RPC
      const { error } = await supabase.rpc('handle_post_vote', {
        p_post_id: postId,
        p_user_id: user.uid,
        p_vote_type: targetVote
      });

      if (error) throw error;

      // Update local state
      setUserVote(targetVote === 0 ? null : (targetVote as VoteType));
      
      // Refetch counts to be precise
      const { data: updatedPost } = await supabase
        .from('posts')
        .select('upvote_count, downvote_count')
        .eq('id', postId)
        .single();
      
      if (updatedPost) {
        setCounts({
          upvoteCount: updatedPost.upvote_count,
          downvoteCount: updatedPost.downvote_count
        });
      }

      return true;
    } catch (err) {
      console.error('Error submitting vote via RPC:', err);
      return false;
    }
  };

  return { userVote, upvoteCount: counts.upvoteCount, downvoteCount: counts.downvoteCount, vote, loading, refresh: fetchData };
}

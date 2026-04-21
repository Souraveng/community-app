import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useFollows(targetUserId?: string) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (targetUserId) {
      checkFollowStatus();
      fetchCounts();
    }
  }, [targetUserId, user]);



  const checkFollowStatus = async () => {
    if (!user?.uid || !targetUserId) return;
    
    // Relaxed guard to allow alphanumeric Firebase UIDs
    if (!user.uid || !targetUserId) {
      setIsFollowing(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.uid)
        .eq('following_id', targetUserId)
        .single();
      
      setIsFollowing(!!data);
    } catch (err) {
      console.error('Error checking follow status:', err);
    }
  };

  const fetchCounts = async () => {
    if (!targetUserId) return;
    
    // Relaxed guard to allow alphanumeric Firebase UIDs
    if (!targetUserId) {
      setFollowerCount(0);
      setFollowingCount(0);
      setLoading(false);
      return;
    }

    try {
      // Fetch follower count
      const { count: followers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId);
      
      // Fetch following count
      const { count: following } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', targetUserId);

      setFollowerCount(followers || 0);
      setFollowingCount(following || 0);
    } catch (err) {
      console.error('Error fetching follow counts:', err);
    } finally {
      setLoading(false);
    }
  };

  const follow = async () => {
    if (!user?.uid || !targetUserId) return;
    
    // Relaxed guard to allow alphanumeric Firebase UIDs
    if (!user?.uid || !targetUserId) {
      console.warn('Follow action blocked: Missing User IDs.');
      return;
    }

    try {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.uid, following_id: targetUserId });
      
      if (error) throw error;
      setIsFollowing(true);
      setFollowerCount(prev => prev + 1);
      
      // Trigger notification
      await supabase.from('notifications').insert({
        receiver_id: targetUserId,
        sender_id: user.uid,
        type: 'follow',
        target_id: user.uid
      });

    } catch (err: any) {
      console.error('Error following user:', err);
      alert(`Follow failed: ${err.message || 'Unknown error'}. Check if your Supabase "follows" table columns are TEXT instead of UUID.`);
    }
  };

  const unfollow = async () => {
    if (!user?.uid || !targetUserId) return;
    
    // Relaxed guard to allow alphanumeric Firebase UIDs
    if (!user?.uid || !targetUserId) {
      return;
    }

    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.uid)
        .eq('following_id', targetUserId);
      
      if (error) throw error;
      setIsFollowing(false);
      setFollowerCount(prev => prev - 1);
    } catch (err: any) {
      console.error('Error unfollowing user:', err);
      alert(`Unfollow failed: ${err.message || 'Unknown error'}`);
    }
  };

  return { isFollowing, followerCount, followingCount, loading, follow, unfollow, refresh: fetchCounts };
}

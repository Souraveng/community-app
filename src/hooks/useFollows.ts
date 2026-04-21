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

  const isValidUUID = (id: string) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  };

  const checkFollowStatus = async () => {
    if (!user?.uid || !targetUserId) return;
    
    // Smart Guard
    if (!isValidUUID(user.uid) || !isValidUUID(targetUserId)) {
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
    
    // Smart Guard
    if (!isValidUUID(targetUserId)) {
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
    
    // Smart Guard
    if (!isValidUUID(user.uid) || !isValidUUID(targetUserId)) {
      console.warn('Follow action blocked: Incompatible ID format (Firebase vs UUID).');
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

    } catch (err) {
      console.error('Error following user:', err);
    }
  };

  const unfollow = async () => {
    if (!user?.uid || !targetUserId) return;
    
    // Smart Guard
    if (!isValidUUID(user.uid) || !isValidUUID(targetUserId)) {
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
    } catch (err) {
      console.error('Error unfollowing user:', err);
    }
  };

  return { isFollowing, followerCount, followingCount, loading, follow, unfollow, refresh: fetchCounts };
}

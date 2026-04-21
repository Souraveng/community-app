import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';

export interface Community {
  name: string;
  description: string;
  avatar_url?: string;
  banner_url?: string;
  member_count: number;
  follower_count: number;
  created_at: string;
  creator_id: string; // Required for deletion check
}

export type MembershipStatus = 'none' | 'pending' | 'approved';

export function useCommunity(name?: string) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [community, setCommunity] = useState<Community | null>(null);
  const [isMember, setIsMember] = useState(false); // Legacy support
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>('none');
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (name) {
      fetchCommunity();
    }
  }, [name, user]);

  const fetchCommunity = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('name', name)
        .single();

      if (error) throw error;
      setCommunity(data);

      if (user && profile) {
        // Check Membership
        const { data: memberData } = await supabase
          .from('community_members')
          .select('status')
          .eq('community_name', name)
          .eq('user_id', profile.id)
          .maybeSingle();
        
        const status = memberData?.status as MembershipStatus || 'none';
        setMembershipStatus(status);
        setIsMember(status === 'approved');

        // Check Following
        const { data: followData } = await supabase
          .from('community_followers')
          .select('*')
          .eq('community_name', name)
          .eq('user_id', profile.id)
          .maybeSingle();
        
        setIsFollowing(!!followData);
      }
    } catch (err) {
      console.error('Error fetching community:', err);
    } finally {
      setLoading(false);
    }
  };

  const createCommunity = async (communityData: Omit<Community, 'member_count' | 'follower_count' | 'created_at' | 'creator_id'>) => {
    if (!profile) return;
    
    try {
      const { error } = await supabase.from('communities').insert({
        ...communityData,
        creator_id: profile.id
      });
      if (error) throw error;

      // Join immediately as approved owner
      await supabase.from('community_members').insert({
        community_name: communityData.name,
        user_id: profile.id,
        status: 'approved'
      });
      
      setMembershipStatus('approved');
      setIsMember(true);
    } catch (err) {
      console.error('Error creating community:', err);
      throw err;
    }
  };

  const requestJoin = async () => {
    if (!profile || !name) return;
    try {
      await supabase.from('community_members').insert({
        community_name: name,
        user_id: profile.id,
        status: 'pending'
      });
      setMembershipStatus('pending');
    } catch (err) {
      console.error('Error requesting join:', err);
    }
  };

  const follow = async () => {
    if (!profile || !name) return;
    try {
      await supabase.from('community_followers').insert({
        community_name: name,
        user_id: profile.id
      });
      
      // Increment follower count
      await supabase.rpc('increment_follower_count', { community_name: name });
      
      setIsFollowing(true);
      if (community) {
        setCommunity({ ...community, follower_count: (community.follower_count || 0) + 1 });
      }
    } catch (err) {
      // If RPC fails (not defined), manually update if possible or just handle error
      console.error('Error following community:', err);
      // Fallback: just update locally for UI response
      setIsFollowing(true);
    }
  };

  const unfollow = async () => {
    if (!profile || !name) return;
    try {
      await supabase.from('community_followers').delete()
        .eq('community_name', name)
        .eq('user_id', profile.id);
      
      setIsFollowing(false);
      if (community) {
        setCommunity({ ...community, follower_count: Math.max(0, (community.follower_count || 0) - 1) });
      }
    } catch (err) {
      console.error('Error unfollowing community:', err);
    }
  };

  const leaveCommunity = async () => {
    if (!profile || !name) return;
    try {
      await supabase.from('community_members').delete()
        .eq('community_name', name)
        .eq('user_id', profile.id);
      setMembershipStatus('none');
      setIsMember(false);
    } catch (err) {
      console.error('Error leaving community:', err);
    }
  };

  const resolveRequest = async (userId: string, approve: boolean) => {
    if (!name) return;
    try {
      if (approve) {
        await supabase.from('community_members')
          .update({ status: 'approved' })
          .eq('community_name', name)
          .eq('user_id', userId);
      } else {
        await supabase.from('community_members')
          .delete()
          .eq('community_name', name)
          .eq('user_id', userId);
      }
    } catch (err) {
      console.error('Error resolving request:', err);
    }
  };

  const getPendingRequests = async () => {
    if (!name) return [];
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          user_id,
          joined_at,
          profiles:user_id (
            username,
            avatar_url,
            full_name
          )
        `)
        .eq('community_name', name)
        .eq('status', 'pending');
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching pending requests:', err);
      return [];
    }
  };

  const deleteCommunity = async (communityName: string) => {
    try {
       const { error } = await supabase.from('communities').delete().eq('name', communityName);
       if (error) throw error;
    } catch (err) {
       console.error('Error deleting community:', err);
       throw err;
    }
  };

  return { 
    community, 
    isMember, 
    isFollowing,
    membershipStatus,
    loading, 
    createCommunity, 
    requestJoin, 
    follow, 
    unfollow,
    leaveCommunity, 
    resolveRequest,
    getPendingRequests,
    deleteCommunity,
    refresh: fetchCommunity
  };
}

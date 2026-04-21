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
  created_at: string;
  creator_id: string; // Required for deletion check
}

export function useCommunity(name?: string) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [community, setCommunity] = useState<Community | null>(null);
  const [isMember, setIsMember] = useState(false);
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
        const { data: memberData } = await supabase
          .from('community_members')
          .select('*')
          .eq('community_name', name)
          .eq('user_id', profile.id)
          .single();
        
        setIsMember(!!memberData);
      }
    } catch (err) {
      console.error('Error fetching community:', err);
    } finally {
      setLoading(false);
    }
  };

  const createCommunity = async (communityData: Omit<Community, 'member_count' | 'created_at'>) => {
    if (!profile) return;
    
    try {
      const { error } = await supabase.from('communities').insert({
        ...communityData,
        creator_id: profile.id
      });
      if (error) throw error;

      // Join immediately
      await joinCommunity(communityData.name);
    } catch (err) {
      console.error('Error creating community:', err);
      throw err;
    }
  };

  const joinCommunity = async (communityName: string) => {
    if (!profile) return;
    try {
      await supabase.from('community_members').insert({
        community_name: communityName,
        user_id: profile.id
      });
      setIsMember(true);
    } catch (err) {
      console.error('Error joining community:', err);
    }
  };

  const leaveCommunity = async (communityName: string) => {
    if (!profile) return;
    try {
      await supabase.from('community_members').delete()
        .eq('community_name', communityName)
        .eq('user_id', profile.id);
      setIsMember(false);
    } catch (err) {
      console.error('Error leaving community:', err);
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

  return { community, isMember, loading, createCommunity, joinCommunity, leaveCommunity, deleteCommunity };
}

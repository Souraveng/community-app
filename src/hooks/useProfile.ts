import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  age: number | null;
  autoplay_enabled: boolean;
  is_private: boolean;
  last_username_change: string | null;
}

export function useProfile(targetUsername?: string) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      // Case 1: Fetching a specific person by username
      if (targetUsername) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', targetUsername)
            .single();
          
          if (error) throw error;
          setProfile(data);
        } catch (err) {
          console.error('Error fetching target profile:', err);
          setProfile(null);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Case 2: Fetching/Syncing current user session
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        // Removed strict UUID validation to support Firebase UIDs (which are alphanumeric)
        // Ensure your Supabase 'profiles' table 'id' column is of type TEXT, not UUID.

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.uid)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setProfile(data);
        } else {
          // Create profile if it doesn't exist
          const newProfile = {
            id: user.uid,
            username: user.email?.split('@')[0] || `user_${Math.floor(Math.random() * 1000)}`,
            full_name: user.displayName,
            avatar_url: user.photoURL,
            banner_url: null,
            bio: '',
            age: null,
            autoplay_enabled: true,
            is_private: false,
          };

          const { data: insertedData, error: insertError } = await supabase
            .from('profiles')
            .upsert(newProfile)
            .select('*')
            .single();

          if (insertError) throw insertError;
          setProfile(insertedData);
        }
      } catch (err) {
        console.error('Error syncing profile:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user, targetUsername]);

  const updateProfile = async (updates: Partial<Profile>) => {
    const currentUser = user || auth.currentUser;
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUser.uid)
        .select('*')
        .single();

      if (error) throw error;
      
      // Sync denormalized display data (username and avatar) in the posts table
      if (updates.username !== undefined || updates.avatar_url !== undefined) {
        const postUpdates: any = {};
        if (updates.username !== undefined) postUpdates.username = updates.username;
        if (updates.avatar_url !== undefined) postUpdates.user_avatar = updates.avatar_url;
        
        if (Object.keys(postUpdates).length > 0) {
          // Fire-and-forget sync to posts
          // Note: If you encounter an RLS error here next, we'll need to update the posts table policy to allow updates
          await supabase
            .from('posts')
            .update(postUpdates)
            .eq('user_id', currentUser.uid);
        }
      }

      setProfile(data);
      return data;
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  return { profile, loading, updateProfile };
}

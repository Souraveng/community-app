import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  age: number | null;
  autoplay_enabled: boolean | null;
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
        const isValidUUID = (id: string) => {
          return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
        };

        if (!isValidUUID(user.uid)) {
          console.warn(`Profile Sync: Firebase UID "${user.uid}" is being matched against a UUID column. Syncing skipped to prevent database error.`);
          setProfile(null);
          setLoading(false);
          return;
        }

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
            bio: '',
            age: null,
            autoplay_enabled: true,
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
        .upsert({ id: currentUser.uid, ...updates })
        .select('*')
        .single();

      if (error) throw error;
      setProfile(data);
      return data;
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  return { profile, loading, updateProfile };
}

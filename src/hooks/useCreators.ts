import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Creator {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  post_count: number;
  follower_count: number;
}

export function useCreators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    setLoading(true);
    try {
      // 1. Fetch all profiles
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .limit(20); // Limit to top 20 for now

      if (profError) throw profError;

      if (!profiles) {
        setCreators([]);
        return;
      }

      // 2. Fetch counts for each profile in parallel
      const creatorsWithStats = await Promise.all(
        profiles.map(async (profile) => {
          // Post count
          const { count: postCount } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('username', profile.username); // Assuming username linkage for now as per usePosts.ts

          // Follower count
          const { count: followerCount } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', profile.id);

          return {
            ...profile,
            post_count: postCount || 0,
            follower_count: followerCount || 0,
          };
        })
      );

      setCreators(creatorsWithStats);
    } catch (err) {
      console.error('Error fetching creators:', err);
    } finally {
      setLoading(false);
    }
  };

  return { creators, loading, refresh: fetchCreators };
}

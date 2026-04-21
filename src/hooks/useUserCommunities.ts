import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface UserCommunity {
  name: string;
  description: string;
  avatar_url?: string;
  member_count: number;
}

export function useUserCommunities(userId?: string) {
  const [communities, setCommunities] = useState<UserCommunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserCommunities();
    }
  }, [userId]);

  const fetchUserCommunities = async () => {
    setLoading(true);
    try {
      // Fetch community names from community_members
      const { data: membershipData, error: membershipError } = await supabase
        .from('community_members')
        .select('community_name')
        .eq('user_id', userId);

      if (membershipError) throw membershipError;

      if (membershipData && membershipData.length > 0) {
        const communityNames = membershipData.map((m: { community_name: string }) => m.community_name);


        // Fetch full community details
        const { data: communityDetails, error: detailsError } = await supabase
          .from('communities')
          .select('*')
          .in('name', communityNames);

        if (detailsError) throw detailsError;
        setCommunities(communityDetails || []);
      } else {
        setCommunities([]);
      }
    } catch (err) {
      console.error('Error fetching user communities:', err);
    } finally {
      setLoading(false);
    }
  };

  return { communities, loading, refresh: fetchUserCommunities };
}

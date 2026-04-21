import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Post {
  id: string;
  title: string;
  content: string;
  community_name: string;
  image_url: string | null;
  video_url: string | null;
  username: string;
  user_avatar: string | null;
  upvotes: number;
  comment_count: number;
  created_at: string;
}

export function usePosts(communityName?: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();

    // Subscribe to new posts
    const subscription = supabase
      .channel('posts')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'posts',
        filter: communityName ? `community_name=eq.${communityName}` : undefined
      }, (payload) => {
        setPosts(prev => [payload.new as Post, ...prev]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [communityName]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (communityName) {
        query = query.eq('community_name', communityName);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const upvotePost = async (postId: string) => {
    try {
       // Optimistic update
       setPosts(prev => prev.map(p => p.id === postId ? { ...p, upvotes: p.upvotes + 1 } : p));
       
       const { error } = await supabase.rpc('increment_upvotes', { post_id: postId });
       if (error) throw error;

       // Note: In a real app, you'd trigger a notification here too.
    } catch (err) {
      console.error('Error upvoting post:', err);
    }
  };

  return { posts, loading, upvotePost, refresh: fetchPosts };
}

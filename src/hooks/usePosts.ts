import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Post {
  id: string;
  title: string;
  content: string;
  community_name: string;
  image_url: string | null;
  video_url: string | null;
  user_id: string; // Required for deletion check
  username: string;
  user_avatar: string | null;
  upvotes: number;
  comment_count: number;
  created_at: string;
}

export function usePosts(communityName?: string, sort: 'latest' | 'trending' = 'latest', userId?: string) {
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
        table: 'posts'
      }, (payload: any) => {
        const newPost = payload.new as Post;
        
        // Client-side filtering to support OR conditions (name vs c:name)
        const matchesCommunity = communityName && (
          newPost.community_name === communityName || 
          newPost.community_name === `c:${communityName}`
        );
        
        const matchesUser = userId && newPost.user_id === userId;
        
        // If no filters provided, show everything (Home Feed)
        // If filters provided, only show if matched
        if (!communityName && !userId) {
          setPosts(prev => [newPost, ...prev]);
        } else if (matchesCommunity || matchesUser) {
          setPosts(prev => [newPost, ...prev]);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [communityName, sort, userId]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select('*');

      if (sort === 'trending') {
        query = query.order('upvotes', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      if (communityName) {
        // Match either the exact community name or the global category prefixed with c:
        query = query.or(`community_name.eq."${communityName}",community_name.eq."c:${communityName}"`);
      }

      if (userId) {
        query = query.eq('user_id', userId);
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
       setPosts(prev => prev.map((p: any) => p.id === postId ? { ...p, upvotes: p.upvotes + 1 } : p));
       
       const { error } = await supabase.rpc('increment_upvotes', { post_id: postId });
       if (error) throw error;

       // Note: In a real app, you'd trigger a notification here too.
    } catch (err) {
      console.error('Error upvoting post:', err);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
      throw err;
    }
  };

  return { posts, loading, upvotePost, deletePost, refresh: fetchPosts };
}

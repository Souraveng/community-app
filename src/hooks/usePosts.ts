import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Post {
  id: string;
  title: string;
  content: string;
  community_name: string;
  image_url: string | null;
  video_url: string | null;
  user_id: string; 
  username: string;
  user_avatar: string | null;
  upvotes: number;
  upvote_count: number;
  downvote_count: number;
  comment_count: number;
  created_at: string;
}

export function usePosts(communityName?: string, sort: 'latest' | 'trending' = 'trending', userId?: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();

    const subscription = supabase
      .channel('posts')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'posts'
      }, () => {
        fetchPosts(); // Refetch on any change to maintain relevance order
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

      if (communityName) {
        query = query.or(`community_name.eq."${communityName}",community_name.eq."c:${communityName}"`);
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      let processedPosts = data || [];

      // Pure Relevance Algorithm: (Net Votes) + (Comments * 2)
      if (sort === 'trending') {
        processedPosts.sort((a: Post, b: Post) => {
          const scoreA = (a.upvotes || 0) + ((a.comment_count || 0) * 2);
          const scoreB = (b.upvotes || 0) + ((b.comment_count || 0) * 2);
          return scoreB - scoreA;
        });
      } else {
        processedPosts.sort((a: Post, b: Post) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      setPosts(processedPosts);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
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

  return { posts, loading, deletePost, refresh: fetchPosts };
}

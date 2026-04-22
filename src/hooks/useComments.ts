import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
  };
  replies?: Comment[];
}

export function useComments(postId?: string, listingId?: string) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (postId || listingId) {
      fetchComments();
    }
  }, [postId, listingId]);

  // Removed restrictive UUID validation to support Firebase UIDs

  const fetchComments = async () => {
    if (!postId && !listingId) {
      setComments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (
            username,
            avatar_url
          )
        `)
        .filter(postId ? 'post_id' : 'listing_id', 'eq', postId || listingId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const threaded = buildCommentTree(data || []);
      setComments(threaded);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const buildCommentTree = (flatComments: any[]): Comment[] => {
    const map = new Map<string, Comment>();
    const roots: Comment[] = [];

    flatComments.forEach(comment => {
      map.set(comment.id, { ...comment, replies: [] });
    });

    flatComments.forEach(comment => {
      const node = map.get(comment.id)!;
      if (comment.parent_id && map.has(comment.parent_id)) {
        map.get(comment.parent_id)!.replies!.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const addComment = async (content: string, parentId: string | null = null) => {
    if (!user?.uid || !profile) return null;

    try {
      const { data, error } = await supabase.from('comments').insert({
        post_id: postId || null,
        listing_id: listingId || null,
        user_id: user.uid,
        parent_id: parentId,
        content: content.trim()
      }).select(`
        *,
        profiles (
          username,
          avatar_url
        )
      `).single();

      if (error) throw error;

      // Create Notification
      await createNotification(data);

      await fetchComments(); // Re-fetch to update tree
      return data;
    } catch (err) {
      console.error('Error adding comment:', err);
      return null;
    }
  };

  const createNotification = async (comment: any) => {
    if (!user?.uid) return;
    
    try {
      let receiverId: string | null = null;
      let type: 'comment' | 'reply' = 'comment';

      if (comment.parent_id) {
        // Find parent comment owner
        const { data: parentComment } = await supabase
          .from('comments')
          .select('user_id')
          .eq('id', comment.parent_id)
          .single();
        
        if (parentComment && parentComment.user_id !== user.uid) {
          receiverId = parentComment.user_id;
          type = 'reply';
        }
      } else if (postId) {
        // Find post owner
        const { data: post } = await supabase
          .from('posts')
          .select('user_id')
          .eq('id', postId)
          .single();
        
        if (post && post.user_id !== user.uid) {
          receiverId = post.user_id;
        }
      } else if (listingId) {
        // Find listing owner
        const { data: listing } = await supabase
          .from('marketplace_listings')
          .select('user_id')
          .eq('id', listingId)
          .single();
        
        if (listing && listing.user_id !== user.uid) {
          receiverId = listing.user_id;
        }
      }

      if (receiverId) {
        await supabase.from('notifications').insert({
          sender_id: user.uid,
          receiver_id: receiverId,
          type: type === 'reply' ? 'comment' : 'comment', // Mapping to existing notification type
          target_id: postId || listingId,
          is_read: false
        });
      }
    } catch (err) {
      console.error('Error creating notification:', err);
    }
  };

  return { comments, loading, addComment, refresh: fetchComments };
}

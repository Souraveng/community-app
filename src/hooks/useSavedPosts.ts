import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useSavedPosts(postId: string) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid && postId) {
      checkIfSaved();
    } else {
      setLoading(false);
    }
  }, [user?.uid, postId]);

  const checkIfSaved = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_posts')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user?.uid)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setIsSaved(!!data);
    } catch (err) {
      console.error('Error checking saved state:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async () => {
    if (!user?.uid) return false;

    try {
      if (isSaved) {
        // Unsave
        await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.uid);
        
        setIsSaved(false);
      } else {
        // Save
        await supabase
          .from('saved_posts')
          .upsert({
            post_id: postId,
            user_id: user.uid,
          });
        
        setIsSaved(true);
      }
      return true;
    } catch (err) {
      console.error('Error toggling save:', err);
      return false;
    }
  };

  return { isSaved, toggleSave, loading };
}

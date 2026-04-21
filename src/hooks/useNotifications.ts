import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  sender_id: string;
  type: 'follow' | 'upvote' | 'comment';
  target_id: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    // Smart Guard: Only subscribe if the receiver_id column (likely UUID) matches the user ID format
    // If mismatch, skip subscription to prevent SDK errors
    if (!isValidUUID(user.uid)) {
      console.warn('Notifications: Realtime subscription skipped due to ID type mismatch (Firebase vs UUID).');
      setLoading(false);
      return;
    }

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase.channel(`notifications_${user.uid}`);
    
    channel
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `receiver_id=eq.${user.uid}`
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.uid]);

  const isValidUUID = (id: string) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  };

  const fetchNotifications = async () => {
    if (!user?.uid) return;

    // Smart Guard: Pre-flight check to prevent database syntax error (22P02)
    if (!isValidUUID(user.uid)) {
      console.warn(`Notifications: Fetch skipped for player "${user.uid}" because the database expects a UUID.`);
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch raw notifications
      const { data: rawData, error: rawError } = await supabase
        .from('notifications')
        .select('*')
        .eq('receiver_id', user.uid)
        .order('created_at', { ascending: false });

      if (rawError) throw rawError;
      if (!rawData || rawData.length === 0) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      // 2. Fetch sender profiles for these notifications
      const senderIds = Array.from(new Set(rawData.map((n: any) => n.sender_id)));
      const validUUIDs = senderIds.filter((id: any) => isValidUUID(id));
      
      let profiles: any[] = [];
      if (validUUIDs.length > 0) {
        const { data: profData, error: profError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', validUUIDs);

        if (profError) {
          console.warn('Profile fetch error:', profError);
        } else {
          profiles = profData || [];
        }
      }

      // 3. Manually merge
      const mergedData = rawData.map((n: any) => ({
        ...n,
        sender: profiles.find((p: any) => p.id === n.sender_id) || null
      }));

      setNotifications(mergedData as Notification[]);
      setUnreadCount(mergedData.filter((n: any) => !n.is_read).length);
    } catch (err) {
      console.error('Error in fetchNotifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      setNotifications(prev => prev.map((n: any) => n.id === notificationId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('receiver_id', user.uid);
      
      setNotifications(prev => prev.map((n: any) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh: fetchNotifications };
}

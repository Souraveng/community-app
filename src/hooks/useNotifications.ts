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

    // Removed restrictive UUID check to support Firebase UIDs

    fetchNotifications();

    // Subscribe to new notifications with a unique channel name or explicit cleanup
    const channelName = `notifications_realtime_${user.uid}_${Date.now()}`;
    const channel = supabase.channel(channelName);
    
    let retryCount = 0;
    const maxRetries = 2;
    let pollingTimer: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (pollingTimer) return;
      console.log('🔄 Realtime unreliable. Starting background polling for notifications...');
      pollingTimer = setInterval(fetchNotifications, 5000);
    };

    const subscribe = () => {
      channel
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          // BROAD LISTENING: Filter in JS to bypass Postgres syntax errors
          // filter: `receiver_id=eq.${user.uid}`
        }, (payload: any) => {
          const notif = payload.new;
          if (notif.receiver_id === user.uid) {
            fetchNotifications();
          }
        })
        .subscribe((status: string) => {
          if (status === 'CHANNEL_ERROR') {
            console.warn('Notifications Realtime Error. Retry:', retryCount);
            if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(subscribe, 2000 * retryCount);
            } else {
              startPolling();
            }
          } else if (status === 'SUBSCRIBED') {
            console.log('✅ Realtime notifications connected');
            retryCount = 0;
          }
        });
    };

    subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (pollingTimer) clearInterval(pollingTimer);
    };
  }, [user?.uid]);

  // Removed restrictive UUID validation

  const fetchNotifications = async () => {
    if (!user?.uid) return;

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
      const validSenderIds = senderIds; // Firebase UIDs are valid
      
      let profiles: any[] = [];
      if (validSenderIds.length > 0) {
        const { data: profData, error: profError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', validSenderIds);

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

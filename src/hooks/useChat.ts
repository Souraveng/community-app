import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export function useChat(conversationId?: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [canSendMessage, setCanSendMessage] = useState(true);

  useEffect(() => {
    if (conversationId && user) {
      fetchMessages();
      checkMessagingConstraints();

      // Subscribe to new messages
      const channel = supabase
        .channel(`chat_${conversationId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
          checkMessagingConstraints();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [conversationId, user]);

  const fetchMessages = async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkMessagingConstraints = async () => {
    if (!conversationId || !user) return;
    try {
      const { data: conv } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (!conv) return;

      if (conv.status === 'pending' && conv.initiator_id === user.uid) {
        // Count messages sent by this user
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversationId)
          .eq('sender_id', user.uid);
        
        setCanSendMessage((count || 0) < 1);
      } else {
        setCanSendMessage(true);
      }
    } catch (err) {
      console.error('Error checking constraints:', err);
    }
  };

  const sendMessage = async (content: string) => {
    if (!conversationId || !user || !content.trim()) return false;
    
    // Final check on constraints
    if (!canSendMessage) {
      alert('You can only send one message until the curator accepts your request.');
      return false;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.uid,
          content: content.trim()
        });

      if (error) throw error;
      
      // Update last_message_at in conversation
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      return false;
    }
  };

  const markAsRead = async () => {
    if (!conversationId || !user) return;
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.uid);
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  return { messages, loading, canSendMessage, sendMessage, markAsRead, refresh: fetchMessages };
}

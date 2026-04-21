import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Conversation {
  id: string;
  created_at: string;
  status: 'pending' | 'accepted' | 'declined';
  participants: string[];
  initiator_id: string;
  last_message_at: string;
  other_user?: any;
}

export function useDirectMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [requests, setRequests] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      // Fetch conversations directly without strict UUID formatting guard
      fetchConversations();
      
      // Real-time subscription for new conversations or status changes
      const channel = supabase
        .channel(`conversations_${user.uid}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'conversations',
          filter: `participants=cs.{${user.uid}}`
        }, () => {
          fetchConversations();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.uid]);


  const fetchConversations = async () => {
    if (!user?.uid) return;
    
    // Guard against missing user session
    if (!user?.uid) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          initiator:initiator_id(*)
        `)
        .contains('participants', [user.uid])
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Enhance conversations with "other user" profile data
      const processed = await Promise.all((data || []).map(async (conv: any) => {
        const otherId = conv.participants.find((id: string) => id !== user.uid);
        
        // Guard nested profile fetch for missing participants
        if (!otherId) {
          return { ...conv, other_user: null };
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', otherId)
          .single();
        
        return { ...conv, other_user: profile };
      }));

      const active = processed.filter(c => 
        c.status === 'accepted' || (c.status === 'pending' && c.initiator_id === user.uid)
      );
      const incoming = processed.filter(c => 
        c.status === 'pending' && c.initiator_id !== user.uid
      );

      setConversations(active);
      setRequests(incoming);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async (otherUserId: string, initialMessage?: string) => {
    if (!user?.uid) return null;

    // Smart Guard - relaxed to allow alphanumeric Firebase UIDs
    if (!user.uid || !otherUserId) {
      console.warn('Conversation creation blocked: Missing User IDs.');
      return null;
    }

    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', [user.uid, otherUserId])
        .maybeSingle();

      if (existing) return existing.id;

      // Create new "pending" conversation
      const { data: newlyCreated, error } = await supabase
        .from('conversations')
        .insert({
          participants: [user.uid, otherUserId],
          initiator_id: user.uid,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      if (initialMessage) {
        await supabase.from('messages').insert({
          conversation_id: newlyCreated.id,
          sender_id: user.uid,
          content: initialMessage
        });
      }

      return newlyCreated.id;
    } catch (err) {
      console.error('Error creating conversation:', err);
      return null;
    }
  };

  const acceptRequest = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'accepted' })
        .eq('id', conversationId);
      
      if (error) throw error;
      fetchConversations();
    } catch (err) {
      console.error('Error accepting request:', err);
    }
  };

  const declineRequest = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);
      
      if (error) throw error;
      fetchConversations();
    } catch (err) {
      console.error('Error declining request:', err);
    }
  };

  return { conversations, requests, loading, createConversation, acceptRequest, declineRequest, refresh: fetchConversations };
}

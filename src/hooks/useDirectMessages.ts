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
      
      // Self-healing Realtime Logic
      const channelName = `conversations_realtime_${user.uid}_${Date.now()}`;
      const channel = supabase.channel(channelName);
      
      let retryCount = 0;
      const maxRetries = 2;
      let pollingTimer: NodeJS.Timeout | null = null;

      const startPolling = () => {
        if (pollingTimer) return;
        console.log('🔄 Realtime unreliable. Starting background polling for conversations...');
        pollingTimer = setInterval(fetchConversations, 10000); // 10s for the sidebar list
      };

      const subscribe = () => {
        channel
          .on('postgres_changes', { 
            event: '*', // Listen to status updates and last_message_at updates
            schema: 'public', 
            table: 'conversations',
            // BROAD LISTENING: Filter in JS to bypass Postgres array syntax issues
            // filter: `participants=cs.{${user.uid}}`
          }, (payload: any) => {
            const conv = payload.new;
            if (conv.participants?.includes(user.uid)) {
              fetchConversations();
            }
          })
          .subscribe((status: string) => {
            if (status === 'CHANNEL_ERROR') {
              console.warn('Conversations Realtime Error. Retry:', retryCount);
              if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(subscribe, 2000 * retryCount);
              } else {
                startPolling();
              }
            } else if (status === 'SUBSCRIBED') {
              console.log('✅ Realtime conversations connected');
              retryCount = 0;
            }
          });
      };

      subscribe();

      return () => {
        supabase.removeChannel(channel);
        if (pollingTimer) clearInterval(pollingTimer);
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

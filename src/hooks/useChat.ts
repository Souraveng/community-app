import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { encryptMessage, decryptMessage } from '../lib/encryption';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  type: 'text' | 'image' | 'video' | 'file';
  media_url?: string;
  iv?: string;
  // Decrypted content for display
  decryptedContent?: string;
}

export function useChat(conversationId?: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [canSendMessage, setCanSendMessage] = useState(true);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);

  useEffect(() => {
    if (conversationId && user?.uid) {
      // Relaxed guard to allow alphanumeric Firebase UIDs
      if (!user.uid || !conversationId) {
        setLoading(false);
        setCanSendMessage(false);
        return;
      }

      fetchConversationMeta();
      fetchMessages();
      checkMessagingConstraints();

      // Self-healing Realtime Logic
      const channelName = `chat_realtime_${conversationId}_${Date.now()}`;
      const channel = supabase.channel(channelName);
      
      let retryCount = 0;
      const maxRetries = 2;
      let pollingTimer: NodeJS.Timeout | null = null;

      const startPolling = () => {
        if (pollingTimer) return;
        console.log('🔄 Realtime unreliable. Starting background polling for chat...');
        pollingTimer = setInterval(fetchMessages, 5000);
      };

      const subscribe = () => {
        channel
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            // BROAD LISTENING: Remove filter to bypass Postgres syntax/type issues
            // filter: `conversation_id=eq.${conversationId}` 
          }, async (payload: any) => {
            const msg = payload.new as Message;
            
            // CLIENT-SIDE FILTERING (Safer)
            if (msg.conversation_id !== conversationId) return;

            // Prevent duplicates (especially if polling is also active)
            setMessages(prev => {
              if (prev.some(m => m.id === msg.id)) return prev;
              
              // Process decryption for the new message
              (async () => {
                let currentOtherId = otherUserId;
                if (!currentOtherId) {
                  const { data: conv } = await supabase
                    .from('conversations')
                    .select('participants')
                    .eq('id', conversationId)
                    .single();
                  currentOtherId = conv?.participants.find((id: string) => id !== user.uid);
                }

                const decrypted = currentOtherId 
                  ? await decryptSingle(msg, currentOtherId)
                  : { ...msg, decryptedContent: msg.content };

                setMessages(innerPrev => {
                  if (innerPrev.some(m => m.id === msg.id && m.decryptedContent)) return innerPrev;
                  return [...innerPrev.filter(m => m.id !== msg.id), decrypted];
                });
              })();

              return [...prev, { ...msg, decryptedContent: '' }]; // Add placeholder while decrypting
            });
            
            checkMessagingConstraints();
          })
          .subscribe((status: string) => {
            if (status === 'CHANNEL_ERROR') {
              console.warn('Chat Realtime Error. Retry:', retryCount);
              if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(subscribe, 2000 * retryCount);
              } else {
                startPolling();
              }
            } else if (status === 'SUBSCRIBED') {
              console.log('✅ Realtime chat connected');
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
  }, [conversationId, user?.uid]);



  const fetchConversationMeta = async () => {
    if (!conversationId || !user?.uid) return;

    const { data } = await supabase
      .from('conversations')
      .select('participants')
      .eq('id', conversationId)
      .single();
    if (data) {
      const other = data.participants.find((id: string) => id !== user.uid);
      setOtherUserId(other || null);
    }
  };

  const decryptSingle = async (msg: Message, otherIdOverride?: string): Promise<Message> => {
    const finalOtherId = otherIdOverride || otherUserId;
    if (!user?.uid || !finalOtherId || !msg.iv || msg.type !== 'text') {
      return { ...msg, decryptedContent: msg.content };
    }
    try {
      const decrypted = await decryptMessage(msg.content, msg.iv, user.uid, finalOtherId);
      return { ...msg, decryptedContent: decrypted };
    } catch {
      return { ...msg, decryptedContent: msg.content };
    }
  };

  const fetchMessages = async () => {
    if (!conversationId || !user?.uid) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Wait for otherUserId to be set, then decrypt
      const raw = data || [];
      // Decrypt all messages
      const { data: conv } = await supabase
        .from('conversations')
        .select('participants')
        .eq('id', conversationId)
        .single();

      const otherId = conv?.participants.find((id: string) => id !== user.uid);

      const decrypted = await Promise.all(raw.map(async (msg: Message) => {
        if (!msg.iv || msg.type !== 'text' || !otherId) {
          return { ...msg, decryptedContent: msg.content };
        }
        try {
          const plain = await decryptMessage(msg.content, msg.iv, user.uid!, otherId);
          return { ...msg, decryptedContent: plain };
        } catch {
          return { ...msg, decryptedContent: msg.content };
        }
      }));

      setMessages(decrypted);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkMessagingConstraints = async () => {
    if (!conversationId || !user?.uid) return;

    try {
      const { data: conv } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (!conv) return;

      if (conv.status === 'pending' && conv.initiator_id === user.uid) {
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
    if (!conversationId || !user?.uid || !content.trim()) return false;
    
    if (!canSendMessage) {
      alert('You can only send one message until the curator accepts your request.');
      return false;
    }

    // Create a temporary ID for the optimistic message
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: user.uid,
      content: content.trim(),
      decryptedContent: content.trim(), // We already know the plaintext
      is_read: false,
      created_at: new Date().toISOString(),
      type: 'text'
    };

    // Optimistically add to state
    setMessages(prev => [...prev.filter(m => !m.id.startsWith('temp_')), optimisticMessage]);

    try {
      // Get other user ID for encryption
      let currentOtherId = otherUserId;
      if (!currentOtherId) {
        const { data: conv } = await supabase
          .from('conversations')
          .select('participants')
          .eq('id', conversationId)
          .single();
        currentOtherId = conv?.participants.find((id: string) => id !== user.uid);
      }

      let encryptedContent = content.trim();
      let iv: string | undefined;

      if (currentOtherId) {
        const encrypted = await encryptMessage(content.trim(), user.uid, currentOtherId);
        encryptedContent = encrypted.ciphertext;
        iv = encrypted.iv;
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.uid,
          content: encryptedContent,
          type: 'text',
          iv,
        });

      if (error) throw error;
      
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove the optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
      return false;
    }
  };

  const sendMedia = async (file: File) => {
    if (!conversationId || !user?.uid) return false;

    if (!canSendMessage) {
      alert('You can only send one message until the curator accepts your request.');
      return false;
    }

    try {
      // Determine type
      let type: 'image' | 'video' | 'file' = 'file';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';

      // Enforce 2MB limit for videos
      if (type === 'video' && file.size > 2 * 1024 * 1024) {
        alert('Video files must be under 2MB.');
        return false;
      }

      // Upload to Supabase Storage
      const ext = file.name.split('.').pop();
      const path = `chat-media/${conversationId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('posts')
        .getPublicUrl(path);

      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.uid,
          content: file.name,
          type,
          media_url: urlData.publicUrl,
        });

      if (msgError) throw msgError;

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return true;
    } catch (err) {
      console.error('Error sending media:', err);
      return false;
    }
  };

  const markAsRead = async () => {
    if (!conversationId || !user?.uid) return;

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

  return { messages, loading, canSendMessage, sendMessage, sendMedia, markAsRead, otherUserId, refresh: fetchMessages };
}

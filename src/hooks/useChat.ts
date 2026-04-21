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

      // Subscribe to new messages
      const channel = supabase
        .channel(`chat_${conversationId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, async (payload: any) => {
          const msg = payload.new as Message;
          const decrypted = await decryptSingle(msg);
          setMessages(prev => [...prev, decrypted]);
          checkMessagingConstraints();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
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

  const decryptSingle = async (msg: Message): Promise<Message> => {
    if (!user?.uid || !otherUserId || !msg.iv || msg.type !== 'text') {
      return { ...msg, decryptedContent: msg.content };
    }
    try {
      const decrypted = await decryptMessage(msg.content, msg.iv, user.uid, otherUserId);
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

    try {
      // Get other user ID for encryption
      const { data: conv } = await supabase
        .from('conversations')
        .select('participants')
        .eq('id', conversationId)
        .single();

      const otherId = conv?.participants.find((id: string) => id !== user.uid);

      let encryptedContent = content.trim();
      let iv: string | undefined;

      if (otherId) {
        const encrypted = await encryptMessage(content.trim(), user.uid, otherId);
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

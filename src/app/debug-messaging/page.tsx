'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { useChat } from '@/hooks/useChat';
import Button from '@/components/common/Button';
import Image from 'next/image';

export default function DebugMessagingPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const { conversations, createConversation } = useDirectMessages();
  
  // Find conversation with selected profile
  const activeConv = conversations.find(c => c.participants.includes(selectedProfileId || ''));
  const { messages, sendMessage, sendMedia, loading } = useChat(activeConv?.id);

  const [text, setText] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*').limit(20);
    setProfiles(data || []);
  };

  const handleStartChat = async (targetId: string) => {
    setSelectedProfileId(targetId);
    await createConversation(targetId);
  };

  if (!user) return <div className="p-20 text-center font-headlines">Please sign in to test messaging.</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto pt-24 p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Profile List */}
        <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/10">
          <h2 className="font-headlines font-black text-xl mb-6">Test Profiles</h2>
          <div className="space-y-4">
            {profiles.map(p => (
              <div key={p.id} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${selectedProfileId === p.id ? 'bg-primary/10 border-primary/20' : 'bg-surface-container-low border-transparent hover:bg-surface-container-high'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold">
                    {p.username?.[0] || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-bold">u/{p.username}</p>
                    <p className="text-[10px] opacity-40 uppercase font-black">ID: {p.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleStartChat(p.id)}
                  className="px-3 py-1 bg-primary text-on-primary text-[10px] font-black uppercase rounded-full"
                >
                  {selectedProfileId === p.id ? 'Active' : 'Select'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 h-[600px] flex flex-col overflow-hidden shadow-2xl">
            {selectedProfileId ? (
              <>
                <div className="p-4 border-b border-outline-variant/10 bg-surface-container-low flex justify-between items-center">
                  <h3 className="font-headlines font-bold">Testing Chat with {profiles.find(p => p.id === selectedProfileId)?.username}</h3>
                  <div className="text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-500/10 px-3 py-1 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">lock</span> Encrypted Logic Active
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {loading ? (
                    <div className="text-center opacity-40 py-10">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center opacity-40 py-10">No messages yet. Send one to start.</div>
                  ) : (
                    messages.map(m => (
                      <div key={m.id} className={`flex ${m.sender_id === user.uid ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-4 rounded-2xl max-w-sm ${m.sender_id === user.uid ? 'bg-primary text-on-primary' : 'bg-surface-container-high'}`}>
                          {m.type === 'image' ? (
                            <img src={m.media_url} className="rounded-xl mb-2 max-h-60" />
                          ) : m.type === 'video' ? (
                            <video src={m.media_url} controls className="rounded-xl mb-2 max-h-60" />
                          ) : (
                            <p className="text-sm">{m.decryptedContent || m.content}</p>
                          )}
                          <div className={`text-[8px] mt-2 opacity-50 flex items-center gap-1 ${m.sender_id === user.uid ? 'justify-end' : ''}`}>
                            {new Date(m.created_at).toLocaleTimeString()}
                            {m.iv && <span className="material-symbols-outlined text-[8px]">lock</span>}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 bg-surface-container-low border-t border-outline-variant/10 flex gap-4">
                  <input 
                    type="text" 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type encrypted message..."
                    className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 text-sm font-body outline-none focus:border-primary"
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage(text).then(() => setText(''))}
                  />
                  <Button variant="primary" onClick={() => sendMessage(text).then(() => setText(''))}>Send</Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
                <span className="material-symbols-outlined text-6xl mb-4">settings_suggest</span>
                <h2 className="text-2xl font-black font-headlines tracking-tighter">Messaging Debugger</h2>
                <p className="max-w-xs font-body text-sm mt-2">Select a profile from the left to start a testing session.</p>
              </div>
            )}
          </div>

          {/* Docs/Info */}
          <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6">
            <h4 className="font-headlines font-black text-sm uppercase tracking-widest text-primary mb-3">Debug Information</h4>
            <ul className="text-xs space-y-2 opacity-70 font-body">
              <li>• <strong>Encryption:</strong> AES-GCM 256-bit with deterministic derivation.</li>
              <li>• <strong>Media:</strong> Uploads to <code>chat-media/</code> bucket.</li>
              <li>• <strong>Constraints:</strong> 1-message limit for pending requests is ACTIVE.</li>
              <li>• <strong>Auth UID:</strong> <code>{user.uid}</code></li>
            </ul>
          </div>
        </div>

      </main>
    </div>
  );
}

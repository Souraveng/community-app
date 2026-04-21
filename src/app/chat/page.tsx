'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { useDirectMessages, Conversation } from '../../hooks/useDirectMessages';
import { useChat } from '../../hooks/useChat';
import Image from 'next/image';
import Button from '../../components/common/Button';
import { supabase } from '../../lib/supabase';

export default function ChatPage() {
  const { user } = useAuth();
  const { conversations, requests, loading: convsLoading, acceptRequest, declineRequest, createConversation } = useDirectMessages();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const { messages, sendMessage, canSendMessage, markAsRead, loading: messagesLoading } = useChat(activeConvId || undefined);
  
  const [activeTab, setActiveTab] = useState<'chats' | 'requests'>('chats');
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = [...conversations, ...requests].find(c => c.id === activeConvId);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (activeConvId) {
      markAsRead();
    }
  }, [activeConvId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${query}%`)
      .neq('id', user?.uid)
      .limit(5);
    setSearchResults(data || []);
  };

  const handleStartChat = async (targetUser: any) => {
    const convId = await createConversation(targetUser.id);
    if (convId) {
      setActiveConvId(convId);
      setSearchQuery('');
      setSearchResults([]);
      setActiveTab('chats');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const sent = await sendMessage(newMessage);
    if (sent) setNewMessage('');
  };

  if (!user) return <div className="min-h-screen bg-background flex items-center justify-center font-headlines text-xl"><Navbar />Please sign in to access Atelier Messaging.</div>;

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <Navbar />
      
      <div className="flex flex-1 pt-16 h-full">
        <Sidebar mb-visible={false} />
        
        <main className="flex-1 ml-0 lg:ml-64 flex h-full">
          {/* Chat Sidebar */}
          <div className="w-full md:w-80 border-r border-outline-variant/10 flex flex-col bg-surface-container-low/20 backdrop-blur-sm">
            <div className="p-6 space-y-6">
              <h1 className="text-2xl font-black font-headlines tracking-tighter">Atelier Messaging</h1>
              
              {/* User Search */}
              <div className="relative">
                <div className="flex items-center bg-surface-container-lowest border border-outline-variant/10 rounded-2xl px-4 py-2 focus-within:border-primary/40 transition-all">
                  <span className="material-symbols-outlined text-sm opacity-40 mr-2">search</span>
                  <input 
                    type="text" 
                    placeholder="Search curators..." 
                    className="bg-transparent border-none focus:ring-0 text-xs w-full font-body"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
                
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest border border-outline-variant/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {searchResults.map(u => (
                      <div 
                        key={u.id} 
                        onClick={() => handleStartChat(u)}
                        className="flex items-center gap-3 p-3 hover:bg-surface-container-low cursor-pointer transition-colors border-b border-outline-variant/5 last:border-none"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden relative border border-outline-variant/10">
                          {u.avatar_url ? <Image src={u.avatar_url} alt={u.username} fill className="object-cover" /> : <span className="material-symbols-outlined text-zinc-400">account_circle</span>}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-on-surface">u/{u.username}</p>
                          <p className="text-[10px] text-on-surface-variant opacity-60 font-medium">{u.full_name || 'Artisan'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-4 border-b border-outline-variant/10 pb-2">
                <button 
                  onClick={() => setActiveTab('chats')}
                  className={`text-[10px] font-black uppercase tracking-widest pb-2 transition-all relative ${activeTab === 'chats' ? 'text-primary' : 'text-on-surface-variant opacity-40'}`}
                >
                  Active Chats
                  {activeTab === 'chats' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                </button>
                <button 
                  onClick={() => setActiveTab('requests')}
                  className={`text-[10px] font-black uppercase tracking-widest pb-2 transition-all relative ${activeTab === 'requests' ? 'text-primary' : 'text-on-surface-variant opacity-40'}`}
                >
                  Requests
                  {requests.length > 0 && (
                    <span className="absolute -top-1 -right-4 w-4 h-4 bg-primary text-on-primary text-[8px] flex items-center justify-center rounded-full font-black">
                      {requests.length}
                    </span>
                  )}
                  {activeTab === 'requests' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                </button>
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-1 px-4">
              {convsLoading ? (
                <div className="p-8 text-center opacity-40 font-headlines text-xs uppercase tracking-widest">Opening Vault...</div>
              ) : (activeTab === 'chats' ? conversations : requests).length > 0 ? (
                (activeTab === 'chats' ? conversations : requests).map(conv => (
                  <div 
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`flex items-center gap-4 p-4 rounded-3xl cursor-pointer transition-all border border-transparent ${activeConvId === conv.id ? 'bg-primary/5 border-primary/10 shadow-lg shadow-primary/5' : 'hover:bg-surface-container-low'}`}
                  >
                    <div className="w-12 h-12 rounded-2xl overflow-hidden relative border border-outline-variant/10">
                      {conv.other_user?.avatar_url ? (
                        <Image src={conv.other_user.avatar_url} alt="Profile" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-on-surface-variant opacity-40 uppercase font-black text-lg">
                          {conv.other_user?.username?.[0] || '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">u/{conv.other_user?.username || 'Unknown Curator'}</p>
                      <p className={`text-[10px] font-medium truncate ${conv.status === 'pending' ? 'text-secondary animate-pulse' : 'text-on-surface-variant opacity-60'}`}>
                        {conv.status === 'pending' ? 'Curatorial Request' : 'Active Thread'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-surface-container-low/30 rounded-3xl border border-dashed border-outline-variant/10 mx-2">
                  <p className="text-[10px] font-bold text-on-surface-variant opacity-40 uppercase tracking-widest">No connections found</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col bg-surface-container-lowest/30 relative">
            {activeConvId ? (
              <>
                {/* Chat Header */}
                <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-lowest/50 backdrop-blur-md sticky top-0 z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl overflow-hidden relative border border-outline-variant/10">
                      {activeConv?.other_user?.avatar_url ? <Image src={activeConv.other_user.avatar_url} alt="User" fill className="object-cover" /> : <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-black uppercase">{activeConv?.other_user?.username?.[0]}</div>}
                    </div>
                    <div>
                      <h3 className="font-headlines font-black text-lg leading-tight">u/{activeConv?.other_user?.username}</h3>
                      <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
                      </p>
                    </div>
                  </div>
                  
                  {activeConv?.status === 'pending' && activeConv.initiator_id !== user.uid && (
                    <div className="flex gap-3">
                      <Button variant="ghost" onClick={() => declineRequest(activeConv.id)} className="text-[10px] h-9">Archive</Button>
                      <Button variant="primary" onClick={() => acceptRequest(activeConv.id)} className="text-[10px] h-9">Accept Request</Button>
                    </div>
                  )}
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-6 scrollbar-hide">
                  {messagesLoading ? (
                    <div className="flex justify-center py-20 opacity-40 font-headlines text-xs uppercase tracking-widest">Studying Thread...</div>
                  ) : messages.map((msg, i) => {
                    const isOwn = msg.sender_id === user.uid;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`} style={{ animationDelay: `${i * 50}ms` }}>
                        <div className={`max-w-[80%] md:max-w-md p-5 rounded-[2rem] shadow-sm ${
                          isOwn 
                            ? 'bg-primary text-on-primary rounded-tr-none shadow-xl shadow-primary/10' 
                            : 'bg-surface-container-low border border-outline-variant/10 rounded-tl-none'
                        }`}>
                          <p className="text-sm font-body leading-relaxed">{msg.content}</p>
                          <div className={`text-[8px] font-bold mt-2 uppercase tracking-widest opacity-40 ${isOwn ? 'text-on-primary' : 'text-on-surface-variant'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 md:p-8 bg-surface-container-lowest/50 backdrop-blur-xl border-t border-outline-variant/10">
                  {activeConv?.status === 'pending' && activeConv.initiator_id === user.uid && !canSendMessage ? (
                    <div className="p-4 rounded-2xl bg-secondary/10 border border-secondary/20 text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-secondary opacity-80">
                        Request pending. You can send more exhibits once the curator accepts.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSend} className="flex gap-4 max-w-4xl mx-auto">
                      <div className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-[2rem] p-2 pr-4 flex items-center shadow-lg focus-within:shadow-primary/5 focus-within:border-primary/40 transition-all">
                        <textarea 
                          rows={1}
                          placeholder="Craft a message..."
                          className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-body p-3 resize-none max-h-32 scrollbar-hide"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSend(e);
                            }
                          }}
                        />
                        <button 
                          type="submit"
                          disabled={!newMessage.trim()}
                          className="w-10 h-10 rounded-full bg-primary text-on-primary disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
                        >
                          <span className="material-symbols-outlined text-xl">send</span>
                        </button>
                      </div>
                    </form>
                  )}
                  <p className="text-[9px] text-center mt-4 font-bold text-on-surface-variant opacity-40 uppercase tracking-[0.2em]">Crafted within the Atelier Messaging protocol</p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
                <div className="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center mb-8 shadow-inner">
                  <span className="material-symbols-outlined text-5xl">forum</span>
                </div>
                <h2 className="text-2xl font-black font-headlines tracking-tighter mb-4">Select a Thread</h2>
                <p className="max-w-xs font-body text-sm leading-relaxed">
                  Connect with fellow artisans to share curatorial visions and initialize collaborative discourse.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

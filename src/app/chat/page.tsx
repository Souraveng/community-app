'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useDirectMessages, Conversation } from '@/hooks/useDirectMessages';
import { useChat } from '@/hooks/useChat';
import { useWebRTC } from '@/hooks/useWebRTC';
import Image from 'next/image';
import Button from '@/components/common/Button';
import { supabase } from '@/lib/supabase';

export default function ChatPage() {
  const { user } = useAuth();
  const { conversations, requests, loading: convsLoading, acceptRequest, declineRequest, createConversation } = useDirectMessages();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const { messages, sendMessage, sendMedia, canSendMessage, markAsRead, loading: messagesLoading, otherUserId } = useChat(activeConvId || undefined);
  const { callState, callType, isMuted, isCameraOff, incomingCall, localVideoRef, remoteVideoRef, startCall, acceptCall, declineCall, endCall, toggleMute, toggleCamera } = useWebRTC(activeConvId || undefined, otherUserId || undefined);
  
  const [activeTab, setActiveTab] = useState<'chats' | 'requests'>('chats');
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeConv = [...conversations, ...requests].find(c => c.id === activeConvId);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (activeConvId) markAsRead();
  }, [activeConvId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await sendMedia(file);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderMessageContent = (msg: any) => {
    const displayText = msg.decryptedContent || msg.content;

    if (msg.type === 'image' && msg.media_url) {
      return (
        <div className="space-y-2">
          <div className="relative w-64 h-48 rounded-2xl overflow-hidden">
            <Image src={msg.media_url} alt="Shared image" fill className="object-cover" sizes="256px" />
          </div>
          {displayText && displayText !== msg.media_url && (
            <p className="text-sm font-body opacity-80">{displayText}</p>
          )}
        </div>
      );
    }
    if (msg.type === 'video' && msg.media_url) {
      return (
        <div className="space-y-2">
          <video src={msg.media_url} controls className="w-64 rounded-2xl" />
        </div>
      );
    }
    if (msg.type === 'file' && msg.media_url) {
      return (
        <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-black/10 rounded-xl hover:bg-black/20 transition-colors">
          <span className="material-symbols-outlined text-lg">description</span>
          <span className="text-sm font-bold underline truncate max-w-[200px]">{displayText}</span>
          <span className="material-symbols-outlined text-sm opacity-60">download</span>
        </a>
      );
    }
    return <p className="text-sm font-body leading-relaxed">{displayText}</p>;
  };

  if (!user) return <div className="min-h-screen bg-background flex items-center justify-center font-headlines text-xl"><Navbar />Please sign in to access Atelier Messaging.</div>;

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <Navbar />
      
      {/* Incoming Call Overlay */}
      {incomingCall && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-300">
          <div className="text-center space-y-8 p-12">
            <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary mx-auto flex items-center justify-center animate-pulse">
              <span className="material-symbols-outlined text-5xl text-primary">
                {incomingCall.type === 'video' ? 'videocam' : 'call'}
              </span>
            </div>
            <div>
              <h2 className="text-3xl font-black font-headlines text-white mb-2">Incoming {incomingCall.type === 'video' ? 'Video' : 'Voice'} Call</h2>
              <p className="text-white/60 font-body">From a fellow curator</p>
            </div>
            <div className="flex gap-6 justify-center">
              <button onClick={declineCall} className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">call_end</span>
              </button>
              <button onClick={acceptCall} className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform animate-bounce">
                <span className="material-symbols-outlined text-3xl">{incomingCall.type === 'video' ? 'videocam' : 'call'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Call Overlay */}
      {callState === 'connected' && (
        <div className="fixed inset-0 z-[90] bg-black flex flex-col">
          {/* Remote Video */}
          <div className="flex-1 relative">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            {callType === 'audio' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-primary animate-pulse">graphic_eq</span>
                </div>
              </div>
            )}
            {/* Local Video PiP */}
            {callType === 'video' && (
              <div className="absolute bottom-24 right-6 w-36 h-48 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          {/* Call Controls */}
          <div className="absolute bottom-0 inset-x-0 p-8 flex justify-center gap-6 bg-gradient-to-t from-black/80 to-transparent">
            <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}>
              <span className="material-symbols-outlined">{isMuted ? 'mic_off' : 'mic'}</span>
            </button>
            {callType === 'video' && (
              <button onClick={toggleCamera} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isCameraOff ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                <span className="material-symbols-outlined">{isCameraOff ? 'videocam_off' : 'videocam'}</span>
              </button>
            )}
            <button onClick={endCall} className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">call_end</span>
            </button>
          </div>
        </div>
      )}

      {/* Calling State */}
      {callState === 'calling' && (
        <div className="fixed inset-0 z-[90] bg-black/90 backdrop-blur-xl flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary mx-auto flex items-center justify-center animate-pulse">
              <span className="material-symbols-outlined text-5xl text-primary">call</span>
            </div>
            <p className="text-white text-xl font-headlines font-bold animate-pulse">Calling...</p>
            <button onClick={endCall} className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center mx-auto hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">call_end</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 pt-16 h-full">
        <Sidebar />
        
        <main className="flex-1 ml-0 lg:ml-64 flex h-full">
          {/* Chat Sidebar */}
          <div className="w-full md:w-80 border-r border-outline-variant/10 flex flex-col bg-surface-container-low/20 backdrop-blur-sm">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black font-headlines tracking-tighter">Messages</h1>
                <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-green-600 bg-green-500/10 px-2 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[10px]">lock</span> E2E Encrypted
                </div>
              </div>
              
              {/* User Search */}
              <div className="relative">
                <div className="flex items-center bg-surface-container-lowest border border-outline-variant/10 rounded-2xl px-4 py-2 focus-within:border-primary/40 transition-all">
                  <span className="material-symbols-outlined text-sm opacity-40 mr-2">search</span>
                  <input type="text" placeholder="Search curators..." className="bg-transparent border-none focus:ring-0 text-xs w-full font-body outline-none" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} />
                </div>
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest border border-outline-variant/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    {searchResults.map(u => (
                      <div key={u.id} onClick={() => handleStartChat(u)} className="flex items-center gap-3 p-3 hover:bg-surface-container-low cursor-pointer transition-colors border-b border-outline-variant/5 last:border-none">
                        <div className="w-8 h-8 rounded-full overflow-hidden relative border border-outline-variant/10">
                          {u.avatar_url ? <Image src={u.avatar_url} alt={u.username} fill className="object-cover" sizes="32px" /> : <span className="material-symbols-outlined text-zinc-400">account_circle</span>}
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
                <button onClick={() => setActiveTab('chats')} className={`text-[10px] font-black uppercase tracking-widest pb-2 transition-all relative ${activeTab === 'chats' ? 'text-primary' : 'text-on-surface-variant opacity-40'}`}>
                  Active Chats
                  {activeTab === 'chats' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                </button>
                <button onClick={() => setActiveTab('requests')} className={`text-[10px] font-black uppercase tracking-widest pb-2 transition-all relative ${activeTab === 'requests' ? 'text-primary' : 'text-on-surface-variant opacity-40'}`}>
                  Requests
                  {requests.length > 0 && <span className="absolute -top-1 -right-4 w-4 h-4 bg-primary text-on-primary text-[8px] flex items-center justify-center rounded-full font-black">{requests.length}</span>}
                  {activeTab === 'requests' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                </button>
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-1 px-4">
              {convsLoading ? (
                <div className="p-8 text-center opacity-40 font-headlines text-xs uppercase tracking-widest">Loading...</div>
              ) : (activeTab === 'chats' ? conversations : requests).length > 0 ? (
                (activeTab === 'chats' ? conversations : requests).map(conv => (
                  <div key={conv.id} onClick={() => setActiveConvId(conv.id)} className={`flex items-center gap-4 p-4 rounded-3xl cursor-pointer transition-all border border-transparent ${activeConvId === conv.id ? 'bg-primary/5 border-primary/10 shadow-lg shadow-primary/5' : 'hover:bg-surface-container-low'}`}>
                    <div className="w-12 h-12 rounded-2xl overflow-hidden relative border border-outline-variant/10">
                      {conv.other_user?.avatar_url ? (
                        <Image src={conv.other_user.avatar_url} alt="Profile" fill className="object-cover" sizes="48px" />
                      ) : (
                        <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-on-surface-variant opacity-40 uppercase font-black text-lg">{conv.other_user?.username?.[0] || '?'}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">u/{conv.other_user?.username || 'Unknown'}</p>
                      <p className={`text-[10px] font-medium truncate ${conv.status === 'pending' ? 'text-secondary animate-pulse' : 'text-on-surface-variant opacity-60'}`}>
                        {conv.status === 'pending' ? 'Request Pending' : 'Active Thread'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-surface-container-low/30 rounded-3xl border border-dashed border-outline-variant/10 mx-2">
                  <p className="text-[10px] font-bold text-on-surface-variant opacity-40 uppercase tracking-widest">No connections</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col bg-surface-container-lowest/30 relative">
            {activeConvId ? (
              <>
                {/* Chat Header */}
                <div className="p-4 md:p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-lowest/50 backdrop-blur-md sticky top-0 z-10">
                  <div className="flex items-center gap-4">
                    <button className="md:hidden mr-2" onClick={() => setActiveConvId(null)}>
                      <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="w-10 h-10 rounded-2xl overflow-hidden relative border border-outline-variant/10">
                      {activeConv?.other_user?.avatar_url ? <Image src={activeConv.other_user.avatar_url} alt="User" fill className="object-cover" sizes="40px" /> : <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-black uppercase">{activeConv?.other_user?.username?.[0]}</div>}
                    </div>
                    <div>
                      <h3 className="font-headlines font-black text-lg leading-tight">u/{activeConv?.other_user?.username}</h3>
                      <p className="text-[9px] font-black uppercase tracking-widest text-green-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">lock</span> Encrypted
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {activeConv?.status === 'accepted' && (
                      <>
                        <button onClick={() => startCall('audio')} className="w-10 h-10 rounded-2xl bg-surface-container-low hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center border border-outline-variant/10">
                          <span className="material-symbols-outlined text-xl">call</span>
                        </button>
                        <button onClick={() => startCall('video')} className="w-10 h-10 rounded-2xl bg-surface-container-low hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center border border-outline-variant/10">
                          <span className="material-symbols-outlined text-xl">videocam</span>
                        </button>
                      </>
                    )}
                    {activeConv?.status === 'pending' && activeConv.initiator_id !== user.uid && (
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => declineRequest(activeConv.id)} className="text-[10px] h-9">Decline</Button>
                        <Button variant="primary" onClick={() => acceptRequest(activeConv.id)} className="text-[10px] h-9">Accept</Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 scrollbar-hide">
                  {messagesLoading ? (
                    <div className="flex justify-center py-20 opacity-40 font-headlines text-xs uppercase tracking-widest">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                      <span className="material-symbols-outlined text-4xl mb-4">lock</span>
                      <p className="text-xs font-bold uppercase tracking-widest">Messages are end-to-end encrypted</p>
                      <p className="text-[10px] mt-1 opacity-60">Send your first message to start</p>
                    </div>
                  ) : messages.map((msg, i) => {
                    const isOwn = msg.sender_id === user.uid;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] md:max-w-md p-4 rounded-[1.5rem] shadow-sm ${
                          isOwn 
                            ? 'bg-primary text-on-primary rounded-tr-sm' 
                            : 'bg-surface-container-low border border-outline-variant/10 rounded-tl-sm'
                        }`}>
                          {renderMessageContent(msg)}
                          <div className={`text-[8px] font-bold mt-2 uppercase tracking-widest opacity-40 flex items-center gap-1 ${isOwn ? 'text-on-primary justify-end' : 'text-on-surface-variant'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {msg.iv && <span className="material-symbols-outlined text-[8px]">lock</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 md:p-6 bg-surface-container-lowest/50 backdrop-blur-xl border-t border-outline-variant/10">
                  {activeConv?.status === 'pending' && activeConv.initiator_id === user.uid && !canSendMessage ? (
                    <div className="p-4 rounded-2xl bg-secondary/10 border border-secondary/20 text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-secondary opacity-80">
                        Request pending — awaiting curator approval
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSend} className="flex gap-3 max-w-4xl mx-auto">
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip" onChange={handleFileSelect} />
                      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-10 h-10 rounded-full bg-surface-container-low hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center border border-outline-variant/10 shrink-0 disabled:opacity-30">
                        <span className="material-symbols-outlined text-lg">{uploading ? 'sync' : 'attach_file'}</span>
                      </button>
                      <div className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-[2rem] px-4 flex items-center shadow-sm focus-within:border-primary/40 transition-all">
                        <textarea 
                          rows={1}
                          placeholder="Type a message..."
                          className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-body py-3 resize-none max-h-24 scrollbar-hide outline-none"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSend(e);
                            }
                          }}
                        />
                        <button type="submit" disabled={!newMessage.trim()} className="w-9 h-9 rounded-full bg-primary text-on-primary disabled:opacity-30 transition-all flex items-center justify-center shrink-0 hover:scale-105 active:scale-95">
                          <span className="material-symbols-outlined text-lg">send</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
                <div className="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center mb-8 shadow-inner">
                  <span className="material-symbols-outlined text-5xl">forum</span>
                </div>
                <h2 className="text-2xl font-black font-headlines tracking-tighter mb-4">Your Messages</h2>
                <p className="max-w-xs font-body text-sm leading-relaxed mb-2">Send private messages to curators</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">lock</span> End-to-end encrypted
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

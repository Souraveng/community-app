'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import Image from 'next/image';
import Button from '@/components/common/Button';

// Mock Data for Showcase
const MOCK_MESSAGES = [
  { id: '1', sender: 'other', type: 'text', content: 'Greeting, curator. I\'ve just finished the preliminary sketches for the upcoming "Ethereal Glass" exhibition.', time: '10:30 AM', encrypted: true },
  { id: '2', sender: 'me', type: 'text', content: 'That sounds perfect. The community is eager to see your latest process. Could you share some of the texture studies?', time: '10:32 AM', encrypted: true },
  { id: '3', sender: 'other', type: 'image', content: 'Glass Texture Study', media_url: 'https://images.unsplash.com/photo-1598439210625-5067c578f3f6?q=80&w=800', time: '10:35 AM', encrypted: true },
  { id: '4', sender: 'other', type: 'text', content: 'Note the way the light refracts through the irregular silicon layers.', time: '10:36 AM', encrypted: true },
  { id: '5', sender: 'me', type: 'text', content: 'Exquisite. I will pin this to the curatorial vision board.', time: '10:40 AM', encrypted: true },
];

const MOCK_CONVS = [
  { id: '1', name: 'Master Glassblower', username: 'elara_v', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200', active: true, lastMsg: 'Exquisite refraction...' },
  { id: '2', name: 'Textile Artisan', username: 'julian_weave', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200', active: false, lastMsg: 'The silk arrived today.' },
  { id: '3', name: 'Curatorial Lead', username: 'atlas_vision', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200', active: false, lastMsg: 'Meeting at 5 PM.' },
];

export default function ChatDemoPage() {
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [showActiveCall, setShowActiveCall] = useState(false);
  const [activeCallType, setActiveCallType] = useState<'audio' | 'video'>('video');

  const triggerCall = (type: 'audio' | 'video') => {
    setActiveCallType(type);
    setShowIncomingCall(true);
  };

  const acceptCall = () => {
    setShowIncomingCall(false);
    setShowActiveCall(true);
  };

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <Navbar />

      {/* Showcase Call Overlay (Incoming) */}
      {showIncomingCall && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center animate-in zoom-in duration-300">
          <div className="text-center space-y-8 p-12 max-w-md">
            <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary mx-auto flex items-center justify-center animate-pulse">
              <span className="material-symbols-outlined text-5xl text-primary">
                {activeCallType === 'video' ? 'videocam' : 'call'}
              </span>
            </div>
            <div>
              <h2 className="text-3xl font-black font-headlines text-white mb-2">Incoming {activeCallType === 'video' ? 'Video' : 'Voice'} Call</h2>
              <p className="text-white/60 font-body">u/elara_v is reaching out</p>
            </div>
            <div className="flex gap-6 justify-center">
              <button onClick={() => setShowIncomingCall(false)} className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">call_end</span>
              </button>
              <button onClick={acceptCall} className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform animate-bounce">
                <span className="material-symbols-outlined text-3xl">{activeCallType === 'video' ? 'videocam' : 'call'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Showcase Call Overlay (Active) */}
      {showActiveCall && (
        <div className="fixed inset-0 z-[90] bg-black flex flex-col">
          <div className="flex-1 relative">
            {/* Mock Remote Stream */}
            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
              {activeCallType === 'video' ? (
                <div className="w-full h-full relative">
                  <Image src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1200" alt="Remote" fill className="object-cover opacity-80" />
                  <div className="absolute inset-x-0 top-12 text-center">
                    <p className="text-white/60 font-black uppercase tracking-[0.3em] text-[10px]">Live Session</p>
                    <h3 className="text-white font-headlines text-2xl font-black">u/elara_v</h3>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-32 h-32 rounded-full border-2 border-primary/40 bg-primary/10 mx-auto flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-primary animate-pulse">graphic_eq</span>
                  </div>
                  <h3 className="text-white font-headlines text-2xl font-black">u/elara_v</h3>
                </div>
              )}
            </div>
            {/* Mock Local PiP */}
            {activeCallType === 'video' && (
              <div className="absolute bottom-24 right-8 w-40 h-52 rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-zinc-800">
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/20 text-3xl">account_circle</span>
                </div>
              </div>
            )}
          </div>
          <div className="p-12 flex justify-center gap-6 bg-gradient-to-t from-black to-transparent">
            <button className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all">
              <span className="material-symbols-outlined">mic</span>
            </button>
            {activeCallType === 'video' && (
              <button className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all">
                <span className="material-symbols-outlined">videocam</span>
              </button>
            )}
            <button onClick={() => setShowActiveCall(false)} className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">call_end</span>
            </button>
          </div>
        </div>
      )}

      {/* Main UI */}
      <div className="flex flex-1 pt-16 h-full">
        <Sidebar />
        
        <main className="flex-1 ml-0 lg:ml-64 flex h-full">
          {/* Sidebar */}
          <div className="w-80 border-r border-outline-variant/10 flex flex-col bg-surface-container-low/20">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black font-headlines tracking-tighter">Showcase</h1>
                <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-green-600 bg-green-500/10 px-2 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[10px]">lock</span> Secured
                </div>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 font-headlines">Testing Mode</p>
                <p className="text-[10px] opacity-60">Demonstrating E2EE, Media Sharing, and WebRTC Calling interfaces.</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 space-y-1">
              {MOCK_CONVS.map(conv => (
                <div key={conv.id} className={`flex items-center gap-4 p-4 rounded-3xl cursor-pointer transition-all ${conv.active ? 'bg-primary/5 shadow-lg border border-primary/10' : 'hover:bg-surface-container-low'}`}>
                  <div className="w-12 h-12 rounded-2xl overflow-hidden relative border border-outline-variant/10">
                    <Image src={conv.avatar} alt={conv.username} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">u/{conv.username}</p>
                    <p className="text-[10px] text-on-surface-variant opacity-60 truncate">{conv.lastMsg}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col bg-surface-container-lowest/30 overflow-hidden relative">
            {/* Header */}
            <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-lowest/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl overflow-hidden relative border border-outline-variant/10">
                  <Image src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200" alt="Active" fill className="object-cover" />
                </div>
                <div>
                  <h3 className="font-headlines font-black text-lg">u/elara_v</h3>
                  <p className="text-[9px] font-black uppercase tracking-widest text-green-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px]">verified</span> Master Curator
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => triggerCall('audio')} className="w-10 h-10 rounded-2xl bg-surface-container-low hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center border border-outline-variant/10">
                  <span className="material-symbols-outlined text-lg">call</span>
                </button>
                <button onClick={() => triggerCall('video')} className="w-10 h-10 rounded-2xl bg-surface-container-low hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center border border-outline-variant/10">
                  <span className="material-symbols-outlined text-lg">videocam</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
              {MOCK_MESSAGES.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-md p-5 rounded-[1.8rem] shadow-sm relative group transition-all hover:shadow-md ${
                    msg.sender === 'me' 
                      ? 'bg-primary text-on-primary rounded-tr-sm' 
                      : 'bg-surface-container border border-outline-variant/10 rounded-tl-sm'
                  }`}>
                    {msg.type === 'image' ? (
                      <div className="space-y-3">
                        <div className="relative w-64 h-48 rounded-2xl overflow-hidden border border-white/10">
                          <Image src={msg.media_url || ''} alt="Shared" fill className="object-cover" />
                        </div>
                        <p className="text-sm font-body opacity-80">{msg.content}</p>
                      </div>
                    ) : (
                      <p className="text-sm font-body leading-relaxed">{msg.content}</p>
                    )}
                    <div className={`text-[8px] font-bold mt-2 uppercase tracking-widest opacity-40 flex items-center gap-1 ${msg.sender === 'me' ? 'text-on-primary justify-end' : 'text-on-surface-variant'}`}>
                      {msg.time} {msg.encrypted && <span className="material-symbols-outlined text-[10px]">enhanced_encryption</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area Overlay for Demo */}
            <div className="p-6 bg-surface-container-lowest/50 border-t border-outline-variant/10 backdrop-blur-xl">
              <div className="max-w-4xl mx-auto flex gap-4">
                <button className="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant/10 hover:text-primary transition-all">
                  <span className="material-symbols-outlined text-xl">attach_file</span>
                </button>
                <div className="flex-1 flex items-center bg-surface-container-low px-6 py-3 rounded-full border border-outline-variant/20 shadow-inner">
                  <input readOnly placeholder="Sending encrypted response..." className="bg-transparent border-none focus:ring-0 text-sm font-body w-full outline-none" />
                  <span className="material-symbols-outlined text-primary text-lg">send</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

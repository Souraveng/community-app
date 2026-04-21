'use client';

import React from 'react';
import Image from 'next/image';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';

export default function NotificationsPage() {
  const { notifications, loading, markAsRead } = useNotifications();

  const getActionText = (type: string) => {
    switch (type) {
      case 'follow': return 'started following you';
      case 'upvote': return 'upvoted your exhibit';
      case 'comment': return 'curated a comment on your post';
      default: return 'interaction occurred';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'follow': return 'person_add';
      case 'upvote': return 'auto_awesome';
      case 'comment': return 'alternate_email';
      default: return 'notifications';
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Navbar />
      
      <div className="flex pt-16">
        <Sidebar />
        
        <main className="flex-1 lg:ml-64 p-8 max-w-4xl mx-auto">
          <header className="mb-12">
            <h1 className="text-4xl font-extrabold tracking-tight font-headlines text-on-surface mb-2">Activity Center</h1>
            <p className="text-on-surface-variant font-body">Manage your community interactions and stay updated on your curation journey.</p>
          </header>

          {/* Filters Section */}
          <div className="flex flex-wrap gap-3 mb-10 overflow-x-auto pb-2 scrollbar-hide">
            <button className="px-6 py-2 rounded-full bg-primary text-on-primary text-xs font-bold uppercase tracking-widest transition-all">All Activity</button>
            <button className="px-6 py-2 rounded-full bg-surface-container-high text-on-surface text-xs font-bold uppercase tracking-widest hover:bg-surface-container-highest transition-all">Mentions</button>
            <button className="px-6 py-2 rounded-full bg-surface-container-high text-on-surface text-xs font-bold uppercase tracking-widest hover:bg-surface-container-highest transition-all">Upvotes</button>
            <button className="px-6 py-2 rounded-full bg-surface-container-high text-on-surface text-xs font-bold uppercase tracking-widest hover:bg-surface-container-highest transition-all">Invitations</button>
          </div>

          {/* Activity List Container */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-20 font-headlines font-bold uppercase tracking-widest opacity-20 animate-pulse">Syncing Network...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-20 opacity-20">
                <span className="material-symbols-outlined text-6xl">leak_remove</span>
                <p className="mt-4 font-headlines font-bold uppercase tracking-[0.2em] text-xs">No activity detected in your sector.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={() => markAsRead(notif.id)}
                  className={`group bg-surface-container-low/30 hover:bg-surface-container-lowest transition-all duration-300 rounded-[2rem] p-6 flex gap-6 cursor-pointer border border-outline-variant/5 hover:border-outline-variant/20 ambient-shadow ${notif.is_read ? 'opacity-60 grayscale-[0.5]' : ''}`}
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden relative border border-outline-variant/10">
                      {notif.sender?.avatar_url ? (
                        <Image src={notif.sender.avatar_url} alt={notif.sender.username} fill className="object-cover" sizes="56px" />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-on-surface-variant">person</span>
                        </div>
                      )}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 rounded-lg p-1.5 border-2 border-surface-container-low shadow-lg bg-primary text-on-primary`}>
                      <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {getIcon(notif.type)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-body text-on-surface leading-tight">
                        <span className="font-extrabold text-on-surface">{notif.sender?.username || 'System'}</span> {getActionText(notif.type)}
                      </p>
                      <span className="text-[10px] font-bold text-on-surface-variant opacity-40 uppercase tracking-widest whitespace-nowrap ml-4">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {!notif.is_read && <div className="w-2 h-2 rounded-full bg-primary mb-2" />}
                  </div>
                  
                  <div className="flex flex-col justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant opacity-20 group-hover:opacity-100 group-hover:text-primary transition-all">
                      chevron_right
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Empty State / Bottom Spacer */}
          <div className="py-20 text-center opacity-20">
            <span className="material-symbols-outlined text-6xl">discovery_tune</span>
            <p className="mt-4 font-headlines font-bold uppercase tracking-[0.2em] text-xs">Curating your latest activity</p>
          </div>
        </main>
      </div>
    </div>
  );
}

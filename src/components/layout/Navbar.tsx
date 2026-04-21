'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Button from '../common/Button';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const authenticated = !!user;
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    communities: any[],
    profiles: any[]
  }>({ communities: [], profiles: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 1) {
        performSearch();
      } else {
        setSearchResults({ communities: [], profiles: [] });
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const [commRes, profRes] = await Promise.all([
        supabase.from('communities').select('*').ilike('name', `%${searchQuery}%`).limit(5),
        supabase.from('profiles').select('*').ilike('username', `%${searchQuery}%`).limit(5)
      ]);
      setSearchResults({
        communities: commRes.data || [],
        profiles: profRes.data || []
      });
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white border-b border-outline-variant/10 shadow-sm font-manrope tracking-tight" suppressHydrationWarning>
      <div className="flex items-center justify-between px-6 py-2 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold tracking-tighter text-zinc-900">
            The Gallery
          </Link>
          {authenticated && !isLandingPage && (
            <div className="hidden md:flex items-center gap-6 font-semibold">
              <Link href="/home" className="text-zinc-500 hover:text-primary transition-colors">Explore</Link>
              <Link href="/communities" className="text-zinc-500 hover:text-primary transition-colors">Communities</Link>
              <Link href="/creators" className="text-zinc-500 hover:text-primary transition-colors">Creators</Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 relative">
          {authenticated && (
            <div className="hidden md:flex items-center bg-surface-container-low px-4 py-2 rounded-full group focus-within:bg-surface-container-lowest transition-all relative">
              <span className="material-symbols-outlined text-on-surface-variant text-sm mr-2">search</span>
              <input 
                className="bg-transparent border-none focus:ring-0 text-sm w-48 font-body" 
                placeholder="Search..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearchDropdown(true)}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
              />

              {/* Real-time Search Dropdown */}
              {showSearchDropdown && (searchQuery.length > 1) && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-surface-container-lowest border border-outline-variant/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 space-y-6">
                    {/* Communities Section */}
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 mb-3 ml-2">Communities</h4>
                      {searchResults.communities.length > 0 ? (
                        <div className="space-y-1">
                          {searchResults.communities.map((c) => (
                            <Link 
                              key={c.name} 
                              href={`/community/${c.name}`} 
                              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                              className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container-low transition-colors group"
                            >
                               <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary overflow-hidden relative">
                                 {c.avatar_url ? <Image src={c.avatar_url} alt={c.name} fill className="object-cover" /> : <span className="material-symbols-outlined text-lg">group</span>}
                               </div>
                               <div className="flex-1">
                                 <p className="text-xs font-bold text-on-surface group-hover:text-primary">g/{c.name}</p>
                                 <p className="text-[10px] text-on-surface-variant line-clamp-1">{c.member_count} collectors</p>
                               </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] italic text-on-surface-variant/40 ml-2">No galleries found</p>
                      )}
                    </div>

                    {/* Creators Section */}
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 mb-3 ml-2">Creators</h4>
                      {searchResults.profiles.length > 0 ? (
                        <div className="space-y-1">
                          {searchResults.profiles.map((p) => (
                            <Link 
                              key={p.id} 
                              href={`/profile/${p.username}`} 
                              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                              className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container-low transition-colors group"
                            >
                               <div className="w-8 h-8 rounded-full bg-secondary/10 overflow-hidden relative border border-outline-variant/10">
                                 {p.avatar_url ? <Image src={p.avatar_url} alt={p.username} fill className="object-cover" /> : <span className="material-symbols-outlined text-zinc-400">account_circle</span>}
                               </div>
                               <div className="flex-1">
                                 <p className="text-xs font-bold text-on-surface group-hover:text-primary">u/{p.username}</p>
                                 <p className="text-[10px] text-on-surface-variant line-clamp-1">{p.full_name || 'Amateur Curator'}</p>
                               </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] italic text-on-surface-variant/40 ml-2">No curators found</p>
                      )}
                    </div>
                  </div>
                  
                  {isSearching && (
                    <div className="absolute top-0 right-0 p-4">
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            {!authenticated ? (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="font-semibold">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary">Sign Up</Button>
                </Link>
              </>
            ) : (
              <>
                <div className="relative">
                  <button 
                    onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                    className={`p-2 transition-colors relative ${showNotificationDropdown ? 'text-primary' : 'text-zinc-500 hover:text-primary'}`}
                  >
                    <span className="material-symbols-outlined">notifications</span>
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotificationDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-surface-container-lowest border border-outline-variant/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/30">
                        <h3 className="text-xs font-black uppercase tracking-widest text-on-surface">Notifications</h3>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-[10px] font-bold text-primary hover:underline"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-[320px] overflow-y-auto scrollbar-hide">
                        {notifications.length > 0 ? (
                          <div className="divide-y divide-outline-variant/5">
                            {notifications.map((n) => (
                              <div 
                                key={n.id} 
                                className={`p-4 flex gap-3 hover:bg-surface-container-low transition-colors cursor-pointer ${!n.is_read ? 'bg-primary/[0.03]' : ''}`}
                                onClick={() => markAsRead(n.id)}
                              >
                                <div className="w-10 h-10 rounded-full overflow-hidden relative border border-outline-variant/10 flex-shrink-0">
                                  {n.sender?.avatar_url ? (
                                    <Image src={n.sender.avatar_url} alt={n.sender.username} fill className="object-cover" />
                                  ) : (
                                    <span className="material-symbols-outlined text-zinc-400">account_circle</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-on-surface leading-normal">
                                    <span className="font-bold">u/{n.sender?.username}</span>
                                    {n.type === 'follow' && ' started following you.'}
                                    {n.type === 'upvote' && ' upvoted your exhibition.'}
                                    {n.type === 'comment' && ' commented on your post.'}
                                  </p>
                                  <p className="text-[10px] text-on-surface-variant/40 mt-1 font-medium">
                                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                  </p>
                                </div>
                                {!n.is_read && (
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center">
                            <span className="material-symbols-outlined text-zinc-300 text-3xl mb-2">notifications_off</span>
                            <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Quiet in the atelier</p>
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-surface-container-low/30 border-t border-outline-variant/10 text-center">
                        <Link href="/notifications" className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 hover:text-primary transition-colors">
                          View All Notifications
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/20 ml-2">
                  <Link href="/profile" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-full overflow-hidden relative border border-outline-variant/10 group-hover:border-primary transition-all">
                      {user.photoURL ? (
                        <Image src={user.photoURL} alt={user.displayName || 'User'} fill className="object-cover" sizes="32px" />
                      ) : (
                        <span className="material-symbols-outlined text-zinc-400">account_circle</span>
                      )}
                    </div>
                    <span className="hidden lg:block text-xs font-bold text-on-surface truncate max-w-[100px]">
                      {user.displayName?.split(' ')[0] || 'Curator'}
                    </span>
                  </Link>
                  <button 
                    onClick={logout}
                    className="p-2 text-on-surface-variant hover:text-primary transition-colors"
                    title="Sign Out"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                  </button>
                </div>
                {/* New Post button removed as it exists in the bottom/floating area */}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

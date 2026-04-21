'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Button from '../common/Button';
import { supabase } from '../../lib/supabase';

const Sidebar = () => {
  const [trending, setTrending] = useState<any[]>([]);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    const { data } = await supabase
      .from('communities')
      .select('name, member_count')
      .order('member_count', { ascending: false })
      .limit(5);
    if (data) setTrending(data);
  };
  const menuItems = [
    { name: 'Home', icon: 'home', path: '/home' },
    { name: 'Explore', icon: 'explore', path: '/explore' },
    { name: 'Communities', icon: 'groups', path: '/communities' },
    { name: 'Creators', icon: 'person', path: '/creators' },
    { name: 'Messages', icon: 'forum', path: '/chat' },
    { name: 'Settings', icon: 'settings', path: '/settings' },
  ];

  return (
    <aside className="hidden md:flex flex-col h-[calc(100vh-4rem)] w-64 fixed left-0 top-16 bg-surface-container-low/30 p-6 space-y-8 border-r border-outline-variant/10">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-container text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              gallery_thumbnail
            </span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-on-surface leading-tight font-headlines">Discovery</h3>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Curated feed</p>
          </div>
        </div>
        
        <ul className="space-y-1 font-manrope text-sm font-semibold uppercase tracking-wider mb-6">
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.path}
                className="flex items-center gap-3 p-3 rounded-lg transition-all text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
              >
                <span className="material-symbols-outlined">
                  {item.icon}
                </span>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>

        <Link href="/communities/create">
          <Button variant="primary" className="w-full justify-start px-6 gap-3 py-4 rounded-2xl group shadow-lg shadow-primary/10">
            <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add_circle</span>
            <span className="font-headlines font-black text-[10px] uppercase tracking-[0.2em]">Create Gallery</span>
          </Button>
        </Link>
      </div>

      <div className="flex-1">
        <div className="bg-tertiary-container/20 p-6 rounded-[2rem] border border-tertiary-container/10">
          <p className="font-headlines font-black text-tertiary text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">trending_up</span> Trending Galleries
          </p>
          <div className="space-y-4 mb-6">
            {trending.length > 0 ? trending.map((c) => (
              <Link key={c.name} href={`/community/${c.name}`} className="flex items-center justify-between group">
                <span className="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors">g/{c.name}</span>
                <span className="text-[10px] font-bold text-on-surface-variant opacity-60">{c.member_count}</span>
              </Link>
            )) : <p className="text-[10px] italic opacity-40">No trending galleries yet.</p>}
          </div>
          <Link href="/communities">
            <button className="w-full py-3 bg-tertiary text-on-tertiary rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-sm">
              View All
            </button>
          </Link>
        </div>
      </div>

      <div className="pt-4 border-t border-outline-variant/10">
        <ul className="space-y-2 font-manrope text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
          <li className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-sm">security</span> Privacy
          </li>
          <li className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-sm">description</span> Terms
          </li>
          <li className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-sm">help</span> Help
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;

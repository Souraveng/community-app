'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function CommunitiesIndexPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCommunities() {
      try {
        const { data, error } = await supabase
          .from('communities')
          .select('*')
          .order('member_count', { ascending: false });

        if (error) throw error;

        // Grouping logic for aesthetic presentation
        const topRated = data.slice(0, 3);
        const newest = [...data].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 3);

        setCategories([
          { name: 'Top Rated', icon: 'star', galleries: topRated },
          { name: 'Newest Arrivals', icon: 'auto_awesome', galleries: newest }
        ]);
      } catch (err) {
        console.error('Error fetching communities:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCommunities();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64 p-8">
          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-black font-headlines tracking-tighter mb-4">Gallery Hub</h1>
              <p className="text-on-surface-variant font-body">
                Explore specialized communities dedicated to specific aesthetic movements and design disciplines. Join a gallery to populate your feed.
              </p>
            </div>
            <Link href="/communities/create">
              <button className="px-8 py-4 bg-primary text-on-primary rounded-2xl font-headlines font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                Launch New Gallery
              </button>
            </Link>
          </header>

          <div className="space-y-16">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-40 font-headlines">
                <span className="material-symbols-outlined animate-spin text-4xl mb-4">sync</span>
                <p className="font-bold uppercase tracking-widest text-xs">Curating Galleries...</p>
              </div>
            ) : categories.map((category) => (
              <section key={category.name}>
                <div className="flex items-center gap-3 mb-8">
                  <span className="material-symbols-outlined text-primary text-2xl">{category.icon}</span>
                  <h2 className="text-xl font-bold font-headlines text-on-surface">{category.name}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.galleries.map((gallery: any) => (
                    <Link 
                      key={gallery.id} 
                      href={`/community/${gallery.name}`} 
                      className="group relative h-48 rounded-[2rem] overflow-hidden bg-surface-container-low border border-outline-variant/10 ambient-shadow hover:-translate-y-1 transition-all"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                      <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity">
                        {gallery.avatar_url ? (
                          <Image 
                            src={gallery.avatar_url} 
                            alt={gallery.name} 
                            fill 
                            className="object-cover" 
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl opacity-20">gallery_thumbnail</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-6 left-8 right-8 z-20">
                        <h3 className="text-white text-xl font-black font-headlines tracking-tight">g/{gallery.name}</h3>
                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{gallery.member_count} Collaborators</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

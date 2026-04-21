'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import Image from 'next/image';
import Link from 'next/link';
import { useCreators } from '@/hooks/useCreators';
import { useFollows } from '@/hooks/useFollows';

export default function CreatorsPage() {
  const { creators, loading } = useCreators();

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64 p-8">
          <header className="mb-12 max-w-4xl">
            <h1 className="text-4xl font-black font-headlines tracking-tighter mb-4">Master Curators</h1>
            <p className="text-on-surface-variant font-body text-lg max-w-2xl">
              Connect with the visionaries defining the next era of aesthetics. From industrial designers to digital architects.
            </p>
          </header>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {creators.map((creator) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function CreatorCard({ creator }: { creator: any }) {
  const { isFollowing, follow, unfollow, followerCount } = useFollows(creator.id);

  return (
    <div className="group bg-surface-container-low/50 p-8 rounded-[2.5rem] border border-outline-variant/10 flex items-start gap-8 hover:bg-surface-container-low transition-all">
      <Link href={`/profile/${creator.username}`} className="w-24 h-24 rounded-full overflow-hidden relative border-4 border-white shadow-xl flex-shrink-0 group-hover:scale-105 transition-transform">
        {creator.avatar_url ? (
          <Image 
            src={creator.avatar_url} 
            alt={creator.username} 
            fill 
            className="object-cover" 
            sizes="96px"
          />
        ) : (
          <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-on-surface-variant text-2xl font-black">
            {creator.username[0].toUpperCase()}
          </div>
        )}
      </Link>
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <div>
            <Link href={`/profile/${creator.username}`}>
              <h2 className="text-xl font-black font-headlines text-on-surface tracking-tight hover:text-primary transition-colors">
                u/{creator.username}
              </h2>
            </Link>
            <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-3">
              {creator.full_name || 'Artisan Curator'}
            </p>
          </div>
          <button 
            onClick={() => isFollowing ? unfollow() : follow()}
            className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              isFollowing 
                ? 'bg-surface-container-high text-on-surface-variant border border-outline-variant/20 hover:bg-red-500 hover:text-white hover:border-transparent' 
                : 'bg-on-surface text-surface hover:scale-105 active:scale-95'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>
        <p className="text-sm text-on-surface-variant line-clamp-2 italic mb-6 font-body">
          {creator.bio || "No curatorial statement provided."}
        </p>
        <div className="flex items-center gap-8 pt-4 border-t border-outline-variant/10">
          <div>
            <p className="text-lg font-black font-headlines">{creator.post_count}</p>
            <p className="text-[10px] uppercase tracking-tighter text-on-surface-variant/60 font-bold">Exhibits</p>
          </div>
          <div>
            <p className="text-lg font-black font-headlines">{followerCount}</p>
            <p className="text-[10px] uppercase tracking-tighter text-on-surface-variant/60 font-bold">Collectors</p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import PostCard from '../../components/common/PostCard';
import CreatePostFAB from '../../components/common/CreatePostFAB';
import PullToRefresh from '../../components/common/PullToRefresh';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { usePosts } from '../../hooks/usePosts';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function HomeFeed() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();
  const [sortType, setSortType] = useState<'latest' | 'trending'>('trending');
  
  const { posts, loading: postsLoading, refresh } = usePosts(undefined, sortType);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-t-2 border-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex pt-16">
        <Sidebar />

        <main className="flex-1 ml-0 md:ml-64 p-8 max-w-4xl mx-auto">
          <PullToRefresh onRefresh={refresh}>
            {/* Featured Section (Asymmetric Bento) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="md:col-span-2 bg-surface-container-lowest rounded-xl p-6 relative overflow-hidden group border border-outline-variant/15 cursor-pointer shadow-sm hover:shadow-md transition-all">
                <div className="relative z-10">
                  <span className="inline-block bg-primary text-on-primary text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full mb-4">Trending Community</span>
                  <h2 className="text-3xl font-headlines font-extrabold text-on-surface mb-2 leading-tight">Abstract Minimalism</h2>
                  <p className="text-on-surface-variant text-sm font-body max-w-md opacity-80 leading-relaxed">Discover the power of negative space and curated aesthetics in our latest community highlight.</p>
                  <div className="mt-8 flex items-center gap-6">
                    <Link href="/community/minimalism" className="bg-on-surface text-surface-bright px-8 py-2.5 rounded-full font-bold text-sm hover:opacity-90 active:scale-95 transition-all">Visit Gallery</Link>
                    <span className="text-xs font-bold text-on-surface-variant/60">12.4k Curators online</span>
                  </div>
                </div>
                <div className="absolute right-0 top-0 w-2/5 h-full opacity-20 group-hover:opacity-30 transition-opacity">
                  <Image 
                    src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1000" 
                    alt="Trending" 
                    fill 
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                </div>
              </div>

              <div className="bg-secondary-container/30 rounded-xl p-6 border border-outline-variant/15 flex flex-col justify-between hover:bg-secondary-container/40 transition-colors shadow-sm">
                <span className="material-symbols-outlined text-secondary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <div>
                  <h3 className="font-headlines font-bold text-secondary text-xl">Daily Curated</h3>
                  <p className="text-xs text-on-secondary-container/70 mt-2 font-medium leading-relaxed italic">Refined content hand-picked by our editors for your morning scroll.</p>
                </div>
              </div>
            </div>

            {/* Feed Header */}
            <div className="flex items-center justify-between mb-10 group">
              <div className="flex items-center gap-6 flex-1">
                <h1 className="text-xs font-black font-headlines uppercase tracking-[0.4em] text-on-surface/50 whitespace-nowrap">Main Exhibit</h1>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-outline-variant/30 to-transparent"></div>
              </div>
              <div className="flex items-center bg-surface-container-high rounded-full p-1 border border-outline-variant/10 shadow-sm">
                <button 
                  onClick={() => setSortType('trending')}
                  className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${sortType === 'trending' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant/40 hover:text-on-surface-variant'}`}
                >
                  Hot
                </button>
                <button 
                  onClick={() => setSortType('latest')}
                  className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${sortType === 'latest' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant/40 hover:text-on-surface-variant'}`}
                >
                  Newest
                </button>
              </div>
            </div>

            {postsLoading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
                <p className="font-headlines font-black uppercase text-[10px] tracking-widest opacity-50 italic">Syncing with curation engine...</p>
              </div>
            ) : (
              <div className="space-y-12 pb-24">
                {posts.map((post: any) => (
                  <PostCard 
                    key={post.id}
                    id={post.id}
                    userId={post.user_id}
                    user={post.username}
                    avatar={post.user_avatar}
                    timestamp={post.created_at}
                    community={post.community_name}
                    title={post.title}
                    content={post.content}
                    image={post.image_url}
                    videoUrl={post.video_url}
                    comments={post.comment_count || 0}
                    votes={post.upvotes || 0}
                    autoplay={profile?.autoplay_enabled ?? true}
                  />
                ))}
              </div>
            )}
          </PullToRefresh>
        </main>
      </div>

      <CreatePostFAB 
        onClick={() => router.push('/create-post')} 
        label="Share Discovery"
      />
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import PostCard from '../../components/common/PostCard';
import CreatePostFAB from '../../components/common/CreatePostFAB';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useRouter } from 'next/navigation';

// Static fallback data normalized to match database schema
const fallbackPosts = [
  {
    id: 'fallback-1',
    user_id: 'system',
    username: 'arch_digest',
    user_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    community_name: 'Architecture',
    title: 'The hidden Brutalist gems of Eastern Europe that you need to see.',
    image_url: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=2000',
    upvotes: 1200,
    comment_count: 248,
  },
  {
    id: 'fallback-2',
    user_id: 'system',
    username: 'tech_minimal',
    user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    created_at: new Date(Date.now() - 18000000).toISOString(),
    community_name: 'Discussion',
    title: "Why I'm switching back to a dumb-phone in 2024. The mental clarity is worth it.",
    content: "After a decade of being tethered to constant notifications, I finally decided to make the jump. Here's a breakdown of the psychological shifts I've noticed in the first 30 days of digital detox and why the current smartphone ecosystem is designed to fragment our attention...",
    upvotes: 854,
    comment_count: 1100,
  },
  {
    id: 'fallback-3',
    user_id: 'system',
    username: 'color_palettes',
    user_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
    created_at: new Date(Date.now() - 28800000).toISOString(),
    community_name: 'Design',
    title: 'The color of the year: "Tonal Dusk". Thoughts?',
    image_url: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=2000',
    upvotes: 4500,
    comment_count: 156,
  }
];

export default function HomeFeed() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Database error:', error.message);
        setPosts(fallbackPosts);
      } else {
        setPosts(data && data.length > 0 ? data : fallbackPosts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts(fallbackPosts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

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
          {/* Featured Section (Asymmetric Bento) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Trending Community Card */}
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

            {/* Daily Curated Card */}
            <div className="bg-secondary-container/30 rounded-xl p-6 border border-outline-variant/15 flex flex-col justify-between hover:bg-secondary-container/40 transition-colors shadow-sm">
              <span className="material-symbols-outlined text-secondary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <div>
                <h3 className="font-headlines font-bold text-secondary text-xl">Daily Curated</h3>
                <p className="text-xs text-on-secondary-container/70 mt-2 font-medium leading-relaxed italic">Refined content hand-picked by our editors for your morning scroll.</p>
              </div>
            </div>
          </div>

          {/* Feed Header (Polished Gallery Aesthetic) */}
          <div className="flex items-center justify-between mb-10 group">
            <div className="flex items-center gap-6 flex-1">
              <h1 className="text-xs font-black font-headlines uppercase tracking-[0.4em] text-on-surface/50 whitespace-nowrap">Main Exhibit</h1>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-outline-variant/30 to-transparent"></div>
            </div>
            <div className="flex items-center bg-surface-container-high rounded-full p-1 border border-outline-variant/10 shadow-sm">
              <button className="px-5 py-1.5 bg-surface-container-lowest rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">Hot</button>
              <button className="px-5 py-1.5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 hover:text-on-surface-variant transition-colors">Newest</button>
              <button className="px-5 py-1.5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 hover:text-on-surface-variant transition-colors">Top</button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
              <p className="font-headlines font-black uppercase text-[10px] tracking-widest opacity-50 italic">Syncing with curation engine...</p>
            </div>
          ) : (
            <div className="space-y-12 pb-24">
              {posts.map((post: any) => (
                <PostCard 
                  key={post.id || `post-${Math.random()}`}
                  id={post.id}
                  userId={post.user_id}
                  user={post.username}
                  avatar={post.user_avatar}
                  timestamp={post.created_at ? new Date(post.created_at).toLocaleDateString() : post.timestamp || 'Just now'}
                  community={post.community_name || post.community}
                  title={post.title}
                  content={post.content}
                  image={post.image_url || post.image}
                  videoUrl={post.video_url || post.videoUrl}
                  upvotes={post.upvotes || 0}
                  comments={post.comment_count || post.comments || 0}
                  autoplay={profile?.autoplay_enabled ?? true}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <CreatePostFAB 
        onClick={() => router.push('/create-post')} 
        label="Share Discovery"
      />
    </div>
  );
}

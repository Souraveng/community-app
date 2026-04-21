'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import PostCard from '../../components/common/PostCard';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useRouter } from 'next/navigation';

// Static fallback data
const fallbackPosts = [
  {
    user: 'arch_digest',
    timestamp: '2 hours ago',
    community: 'Architecture',
    title: 'The hidden Brutalist gems of Eastern Europe that you need to see.',
    image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=2000',
    upvotes: '1.2k',
    comments: '248',
  },
  {
    user: 'tech_minimal',
    timestamp: '5 hours ago',
    community: 'Discussion',
    title: "Why I'm switching back to a dumb-phone in 2024. The mental clarity is worth it.",
    content: "After a decade of being tethered to constant notifications, I finally decided to make the jump. Here's a breakdown of the psychological shifts I've noticed in the first 30 days of digital detox and why the current smartphone ecosystem is designed to fragment our attention...",
    upvotes: '854',
    comments: '1.1k',
  },
  {
    user: 'color_palettes',
    timestamp: '8 hours ago',
    community: 'Design',
    title: 'The color of the year: "Tonal Dusk". Thoughts?',
    image: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=2000',
    upvotes: '4.5k',
    comments: '156',
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

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          // Map database fields to UI props
          const mappedPosts = data.map(post => ({
            id: post.id,
            user: post.username,
            avatar: post.user_avatar,
            timestamp: new Date(post.created_at).toLocaleDateString(),
            community: post.community_name,
            title: post.title,
            content: post.content,
            image: post.image_url,
            videoUrl: post.video_url,
            upvotes: post.upvotes?.toString() || '0',
            comments: post.comment_count?.toString() || '0'
          }));
          setPosts(mappedPosts);
        } else {
          setPosts(fallbackPosts);
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
        setPosts(fallbackPosts);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
            <div className="md:col-span-2 bg-surface-container-lowest rounded-[2rem] p-8 relative overflow-hidden group border border-outline-variant/10 cursor-pointer ambient-shadow">
              <div className="relative z-10">
                <span className="inline-block bg-primary text-on-primary text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                  Trending Community
                </span>
                <h2 className="text-3xl font-headlines font-extrabold text-on-surface mb-2 leading-tight">Abstract Minimalism</h2>
                <p className="text-on-surface-variant text-sm font-body max-w-sm mb-6">Discovery the power of negative space and curated aesthetics in our latest community highlight.</p>
                <div className="flex items-center gap-4">
                  <button className="bg-on-surface text-surface px-6 py-2 rounded-full font-bold text-sm hover:opacity-90 transition-all">
                    Visit Gallery
                  </button>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">12.4k Curators online</span>
                </div>
              </div>
              <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 group-hover:opacity-20 transition-all duration-700">
                <Image
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                  alt="Abstract art"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 20vw"
                />
              </div>
            </div>

            <div className="bg-secondary-container/20 rounded-[2rem] p-6 border border-secondary-container/10 flex flex-col justify-between">
              <span className="material-symbols-outlined text-secondary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              <div>
                <h3 className="font-headlines font-bold text-secondary text-lg">Daily Curated</h3>
                <p className="text-xs text-on-surface-variant mt-1 font-body leading-relaxed">
                  Refined content hand-picked by our editors for your morning scroll.
                </p>
              </div>
            </div>
          </div>

          {/* Feed Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-headlines font-extrabold tracking-tight text-on-surface">Main Exhibit</h1>
            <div className="flex items-center bg-surface-container-high rounded-full p-1 border border-outline-variant/10">
              <button className="px-5 py-1.5 bg-surface-container-lowest rounded-full text-xs font-bold ambient-shadow text-on-surface">Hot</button>
              <button className="px-5 py-1.5 text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors">Newest</button>
              <button className="px-5 py-1.5 text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors">Top</button>
            </div>
          </div>

          {/* Posts List */}
          <div className="space-y-8">
            {posts.map((post, index) => (
              <PostCard 
                key={index} 
                id={post.id} 
                {...post} 
                autoplay={profile?.autoplay_enabled ?? true}
              />
            ))}
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="py-12 flex justify-center">
              <div className="flex items-center gap-3 text-on-surface-variant/40">
                <span className="material-symbols-outlined animate-spin">refresh</span>
                <span className="text-xs font-headlines font-bold uppercase tracking-[0.2em]">Curating new exhibits</span>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Profile FAB */}
      <Link href="/create-post">
        <button className="hidden md:flex fixed bottom-8 right-8 bg-gradient-to-br from-primary to-primary-container text-on-primary p-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all group items-center gap-2">
          <span className="material-symbols-outlined">edit</span>
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold text-sm whitespace-nowrap px-0 group-hover:px-2">
            Create New Post
          </span>
        </button>
      </Link>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import PostCard from '../../components/common/PostCard';
import PostForm from '../../components/common/PostForm';
import Modal from '../../components/common/Modal';
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
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Reverted to stable 'posts' base table
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Database view missing, using fallback data:', error.message);
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

  const handlePostCreated = () => {
    setIsPostModalOpen(false);
    fetchPosts();
  };

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
            <div className="md:col-span-2 relative group overflow-hidden rounded-[3rem] bg-surface-container-high border border-white/10 p-10 flex flex-col justify-end min-h-[400px]">
              <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-700">
                <Image 
                  src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=2000" 
                  alt="Trending" 
                  fill 
                  className="object-cover scale-110 group-hover:scale-100 transition-transform duration-1000"
                />
              </div>
              <div className="relative z-10">
                <span className="bg-primary text-on-primary text-[10px] font-black tracking-[0.2em] uppercase px-4 py-2 rounded-full mb-6 inline-block">Trending Community</span>
                <h2 className="text-5xl font-black font-headlines tracking-tighter text-on-surface mb-4 leading-none italic uppercase">Abstract Minimalism</h2>
                <p className="text-on-surface-variant font-medium max-w-md mb-8 opacity-70">Discovery the power of negative space and curated aesthetics in our latest community highlight.</p>
                <div className="flex items-center gap-6">
                  <Link href="/community/minimalism" className="bg-surface text-on-surface px-8 py-4 rounded-2xl font-black font-headlines text-xs uppercase tracking-widest hover:bg-on-surface hover:text-surface transition-all active:scale-95 shadow-xl">Visit Gallery</Link>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">12.4K Curators Online</span>
                </div>
              </div>
            </div>

            <div className="relative group overflow-hidden rounded-[3rem] bg-primary-container p-10 flex flex-col justify-between border border-white/5">
              <div className="text-primary">
                <span className="material-symbols-outlined text-4xl group-hover:rotate-12 transition-transform duration-500">sparkles</span>
              </div>
              <div>
                <h3 className="text-2xl font-black font-headlines tracking-tighter text-on-primary-container mb-4 leading-none italic uppercase">Daily Curated</h3>
                <p className="text-primary text-[10px] font-bold leading-relaxed opacity-70 uppercase tracking-widest">Refined content hand-picked by our editors for your morning scroll.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-8">
            <h3 className="font-headlines font-black text-2xl uppercase tracking-tighter text-on-surface italic">Main Exhibit</h3>
            <div className="flex bg-surface-container-high p-1 rounded-2xl border border-white/5">
              <button className="bg-surface text-on-surface px-6 py-2 rounded-xl font-black font-headlines text-[10px] uppercase tracking-widest shadow-lg">Hot</button>
              <button className="text-on-surface-variant px-6 py-2 rounded-xl font-black font-headlines text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">Newest</button>
              <button className="text-on-surface-variant px-6 py-2 rounded-xl font-black font-headlines text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">Top</button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
              <p className="font-headlines font-black uppercase text-[10px] tracking-widest opacity-50 italic">Syncing with curation engine...</p>
            </div>
          ) : (
            <div className="space-y-8 pb-24">
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
        onClick={() => setIsPostModalOpen(true)} 
        label="Share Discovery"
      />

      <Modal 
        isOpen={isPostModalOpen} 
        onClose={() => setIsPostModalOpen(false)}
        title="Share a Discovery"
      >
        <PostForm 
          mode="global" 
          layout="box"
          onPostCreated={handlePostCreated}
          onCancel={() => setIsPostModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

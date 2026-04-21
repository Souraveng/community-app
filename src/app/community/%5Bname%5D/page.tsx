'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../../../components/layout/Navbar';
import Sidebar from '../../../components/layout/Sidebar';
import PostCard from '../../../components/common/PostCard';
import Button from '../../../components/common/Button';
import Image from 'next/image';
import { useCommunity } from '../../../hooks/useCommunity';
import { usePosts } from '../../../hooks/usePosts';
import { useProfile } from '../../../hooks/useProfile';

export default function DynamicCommunityPage() {
  const params = useParams();
  const name = params.name as string;
  const { community, isMember, loading: communityLoading, joinCommunity, leaveCommunity } = useCommunity(name);
  const { posts, loading: postsLoading } = usePosts(name);
  const { profile } = useProfile();

  if (communityLoading) return <div className="min-h-screen bg-background flex items-center justify-center font-headlines text-2xl tracking-widest"><Navbar />Opening Gallery...</div>;
  if (!community) return (
    <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4">
      <Navbar />
      <p className="font-headlines text-2xl text-on-surface">Gallery not found.</p>
      <Button variant="primary" onClick={() => window.location.href='/home'}>Back to Home</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex pt-16">
        <Sidebar mb-visible={false} />
        
        <main className="flex-1 ml-0 md:ml-64 min-h-screen">
          {/* Community Banner & Header */}
          <header className="relative">
            <div className="h-48 md:h-64 w-full overflow-hidden relative">
              <Image 
                src={community.banner_url || "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=2000"}
                alt={`${community.name} banner`}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </div>
            <div className="max-w-5xl mx-auto px-8">
              <div className="relative -mt-12 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8">
                <div className="flex items-end gap-6 text-on-surface">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-surface-container-lowest p-1 ambient-shadow border border-outline-variant/10">
                    <div className="w-full h-full rounded-2xl overflow-hidden bg-primary-container flex items-center justify-center relative">
                      {community.avatar_url ? (
                        <Image src={community.avatar_url} alt={community.name} fill className="object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-on-primary-container text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        architecture
                      </span>
                      )}
                    </div>
                  </div>
                  <div className="mb-2">
                    <h1 className="text-3xl md:text-4xl font-black font-headlines tracking-tighter">g/{community.name}</h1>
                    <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest font-body opacity-60">
                      {community.member_count?.toLocaleString() || 0} Members • Gallery Active
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <Button 
                    variant={isMember ? 'secondary' : 'primary'} 
                    className="px-8 py-3"
                    onClick={() => isMember ? leaveCommunity(community.name) : joinCommunity(community.name)}
                  >
                    {isMember ? 'Joined' : 'Join Community'}
                  </Button>
                  <button className="p-3 bg-surface-container-high rounded-full hover:bg-surface-container-highest transition-all text-on-surface">
                    <span className="material-symbols-outlined">share</span>
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Content Grid */}
          <div className="max-w-5xl mx-auto px-8 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Feed Section */}
            <div className="lg:col-span-8 space-y-10">
              {/* Sorting & Filters */}
              <div className="flex items-center justify-between border-b border-outline-variant/10 pb-4">
                <div className="flex items-center gap-6">
                  <button className="text-xs font-black uppercase tracking-[0.2em] text-primary relative pb-4">
                    Exhibits
                    <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary" />
                  </button>
                  <button className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant hover:text-on-surface transition-colors pb-4">
                    Top Charts
                  </button>
                </div>
              </div>

              {/* Posts */}
              <div className="space-y-8">
                {postsLoading ? (
                   <div className="text-center py-20 font-headlines font-bold uppercase tracking-widest opacity-20 animate-pulse">Scanning Exhibits...</div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-20 opacity-20">
                    <span className="material-symbols-outlined text-6xl">leak_remove</span>
                    <p className="mt-4 font-headlines font-bold uppercase tracking-[0.2em] text-xs">No exhibits published in this gallery.</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      id={post.id}
                      user={post.username}
                      timestamp="Recent"
                      community={post.community_name}
                      title={post.title}
                      content={post.content}
                      image={post.image_url}
                      videoUrl={post.video_url}
                      upvotes={post.upvotes.toString()}
                      comments={post.comment_count.toString()}
                      autoplay={profile?.autoplay_enabled ?? true}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Sidebar Section */}
            <aside className="lg:col-span-4 space-y-8">
              {/* About Card */}
               <section className="bg-surface-container-low/30 rounded-[2.5rem] p-8 space-y-6 border border-outline-variant/10 ambient-shadow">
                <h3 className="font-headlines font-extrabold text-lg text-on-surface tracking-tight uppercase tracking-widest text-primary">Curatorial Vision</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed font-body italic opacity-80">
                  "{community.description || 'No curatorial vision defined for this gallery.'}"
                </p>
                <div className="flex items-center gap-4 py-6 border-y border-outline-variant/10">
                  <div>
                    <p className="text-2xl font-black font-headlines text-on-surface tracking-tighter">{community.member_count?.toLocaleString() || 0}</p>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/40 font-black">Curators Joined</p>
                  </div>
                  <div className="w-px h-10 bg-outline-variant/20"></div>
                  <div>
                    <p className="text-2xl font-black font-headlines text-on-surface tracking-tighter">Active</p>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/40 font-black">Present Now</p>
                  </div>
                </div>
                <div className="space-y-4 pt-2 font-body text-on-surface-variant">
                  <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
                    <span className="material-symbols-outlined text-lg text-primary">calendar_today</span>
                    <span>EST. APRIL 2024</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
                    <span className="material-symbols-outlined text-lg text-primary">public</span>
                    <span>Open Access</span>
                  </div>
                </div>
              </section>

              {/* Action */}
              <Button 
                variant="secondary" 
                className="w-full py-4 rounded-[2rem] font-headlines font-black uppercase tracking-widest"
                onClick={() => window.location.href = `/create-post?community=${community.name}`}
              >
                Publish in g/{community.name}
              </Button>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

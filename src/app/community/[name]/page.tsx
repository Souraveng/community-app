'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../../../components/layout/Navbar';
import Sidebar from '../../../components/layout/Sidebar';
import PostCard from '../../../components/common/PostCard';
import Button from '../../../components/common/Button';
import Image from 'next/image';
import { supabase } from '../../../lib/supabase';
import { useCommunity } from '../../../hooks/useCommunity';
import Link from 'next/link';

export default function CommunityPage() {
  const { name } = useParams();
  const { community, isMember, joinCommunity, leaveCommunity, loading } = useCommunity(name as string);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    if (name) {
      fetchPosts();
    }
  }, [name]);

  const fetchPosts = async () => {
    setPostsLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('community_name', name)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching community posts:', err);
    } finally {
      setPostsLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center font-headlines text-2xl"><Navbar />Analyzing Gallery...</div>;
  if (!community) return <div className="min-h-screen bg-background flex items-center justify-center font-headlines text-2xl"><Navbar />Gallery not found.</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex pt-16">
        <Sidebar />
        
        <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 max-w-5xl mx-auto w-full">
          {/* Community Header */}
          <div className="relative mb-8">
            <div className="h-48 md:h-64 w-full rounded-[2.5rem] bg-gradient-to-tr from-surface-container-highest to-primary/10 border border-outline-variant/10 ambient-shadow overflow-hidden relative">
               {community.banner_url && <Image src={community.banner_url} alt="Banner" fill className="object-cover" />}
               <div className="absolute inset-0 bg-black/10" />
            </div>

            <div className="flex flex-col md:flex-row items-end gap-6 px-8 -mt-12 relative z-10">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-surface-container-lowest p-2 ambient-shadow border border-outline-variant/10">
                <div className="w-full h-full rounded-2xl bg-primary/10 flex items-center justify-center text-primary overflow-hidden relative">
                  {community.avatar_url ? (
                    <Image src={community.avatar_url} alt={community.name} fill className="object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-4xl">group</span>
                  )}
                </div>
              </div>

              <div className="flex-1 pb-2">
                <h1 className="text-3xl md:text-5xl font-black font-headlines tracking-tighter text-on-surface">
                  g/{community.name}
                </h1>
                <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest opacity-60">
                  {community.member_count} collectors • Active Gallery
                </p>
              </div>

              <div className="pb-4 flex gap-4">
                {isMember && (
                  <Link href={`/create-post?community=${community.name}`}>
                    <Button variant="secondary">Post Exhibit</Button>
                  </Link>
                )}
                {isMember ? (
                  <Button variant="ghost" onClick={() => leaveCommunity(community.name)}>Joined</Button>
                ) : (
                  <Button variant="primary" onClick={() => joinCommunity(community.name)}>Join Gallery</Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
            {/* Posts Feed */}
            <div className="lg:col-span-8 space-y-6">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="font-headlines font-black text-xl uppercase tracking-tighter">Community Exhibits</h3>
                  <div className="flex gap-4">
                    <button className="text-[10px] font-black uppercase tracking-widest text-primary border-b-2 border-primary pb-1">New</button>
                    <button className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 hover:opacity-100 transition-opacity">Top</button>
                  </div>
               </div>

               {postsLoading ? (
                 <div className="text-center py-20 opacity-50 font-headlines">Curating exhibits...</div>
               ) : posts.length > 0 ? (
                 posts.map((post) => (
                   <PostCard 
                     key={post.id}
                     id={post.id}
                     user={post.username}
                     avatar={post.user_avatar}
                     timestamp={new Date(post.created_at).toLocaleDateString()}
                     community={post.community_name}
                     title={post.title}
                     content={post.content}
                     image={post.image_url}
                     upvotes={post.upvotes.toString()}
                     comments={post.comment_count.toString()}
                   />
                 ))
               ) : (
                 <div className="text-center py-20 bg-surface-container-low/20 rounded-[2.5rem] border border-dashed border-outline-variant/20">
                   <p className="font-headlines font-bold text-on-surface-variant mb-4">No exhibits yet in this gallery.</p>
                   <Button variant="secondary">Be the first to curate</Button>
                 </div>
               )}
            </div>

            {/* About Section */}
            <div className="lg:col-span-4">
              <div className="bg-surface-container-low/30 p-8 rounded-[2.5rem] border border-outline-variant/10 sticky top-24">
                <h3 className="font-headlines font-black text-lg mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">info</span> About Gallery
                </h3>
                <p className="text-sm font-body text-on-surface-variant leading-relaxed mb-6">
                  {community.description}
                </p>
                <div className="space-y-4 pt-6 border-t border-outline-variant/10">
                   <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Members</span>
                     <span className="text-sm font-black font-headlines text-primary">{community.member_count}</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Founded</span>
                     <span className="text-xs font-bold text-on-surface">{new Date(community.created_at).getFullYear()}</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

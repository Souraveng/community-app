'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../../../components/layout/Navbar';
import Sidebar from '../../../components/layout/Sidebar';
import PostCard from '../../../components/common/PostCard';
import PostForm, { PostFormHandle } from '../../../components/common/PostForm';
import CreatePostFAB from '../../../components/common/CreatePostFAB';
import MemberManagement from '../../../components/common/MemberManagement';
import Button from '../../../components/common/Button';
import Image from 'next/image';
import { supabase } from '../../../lib/supabase';
import { useCommunity } from '../../../hooks/useCommunity';
import { useProfile } from '../../../hooks/useProfile';
import { usePosts } from '../../../hooks/usePosts';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function CommunityPage() {
  const { name } = useParams();
  const { 
    community, 
    membershipStatus, 
    isFollowing,
    requestJoin, 
    leaveCommunity, 
    follow,
    unfollow,
    resolveRequest,
    getPendingRequests,
    deleteCommunity, 
    loading,
    refresh
  } = useCommunity(name as string);
  
  const { profile } = useProfile();
  const { posts, loading: postsLoading, deletePost } = usePosts(name as string);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const postFormRef = useRef<PostFormHandle>(null);

  const isOwner = profile && community && profile.id === community.creator_id;
  const isApproved = membershipStatus === 'approved' || isOwner;

  useEffect(() => {
    if (isOwner) {
      getPendingRequests().then(setPendingRequests);
    }
  }, [isOwner, community]);

  const handleResolve = async (userId: string, approve: boolean) => {
    await resolveRequest(userId, approve);
    setPendingRequests(prev => prev.filter(r => r.user_id !== userId));
    if (approve) refresh();
  };

  const handleDeleteCommunity = async () => {
    if (!window.confirm('WARNING: Are you sure you want to PERMANENTLY delete this gallery? All exhibits and membership data will be lost.')) return;
    try {
      await deleteCommunity(name as string);
      window.location.href = '/';
    } catch (err) {
      alert('Failed to delete gallery. Please try again.');
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
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl md:text-5xl font-black font-headlines tracking-tighter text-on-surface">
                    c/{community.name}
                  </h1>
                  {isOwner && (
                    <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-primary/20">
                      Owner
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest opacity-60">
                    {community.member_count || 0} Collectors
                  </p>
                  <div className="w-1 h-1 rounded-full bg-on-surface-variant/20" />
                  <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest opacity-60">
                    {community.follower_count || 0} Followers
                  </p>
                </div>
              </div>

              <div className="pb-4 flex gap-3">
                {isOwner ? (
                  <Button variant="ghost" className="border-outline-variant/10" onClick={handleDeleteCommunity}>
                    Manage Gallery
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant={isFollowing ? "secondary" : "outline"} 
                      className={isFollowing ? "" : "border-outline-variant/20"}
                      onClick={isFollowing ? unfollow : follow}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>

                    {membershipStatus === 'approved' ? (
                      <Button variant="ghost" onClick={leaveCommunity}>Collector</Button>
                    ) : membershipStatus === 'pending' ? (
                      <Button variant="secondary" disabled>Request Sent</Button>
                    ) : (
                      <Button variant="primary" onClick={requestJoin}>Join Gallery</Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Member Management for Owner */}
          {isOwner && pendingRequests.length > 0 && (
            <MemberManagement 
              requests={pendingRequests} 
              onResolve={handleResolve} 
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
            {/* Posts Feed */}
            <div className="lg:col-span-8 space-y-6">
               {(isOwner || membershipStatus === 'approved') && (
                 <PostForm 
                  ref={postFormRef}
                  mode="community" 
                  layout="bar"
                  communityName={community.name} 
                  onPostCreated={() => window.location.reload()} 
                 />
               )}

               <div className="flex items-center justify-between mb-8">
                  <h3 className="font-headlines font-black text-xl uppercase tracking-tighter text-on-surface">Community Exhibits</h3>
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
                     userId={post.user_id}
                     user={post.username}
                     avatar={post.user_avatar}
                     timestamp={post.created_at}
                     community={post.community_name}
                     title={post.title}
                     content={post.content}
                     image={post.image_url}
                     videoUrl={post.video_url}
                     comments={post.comment_count}
                     autoplay={profile?.autoplay_enabled ?? true}
                     onDelete={deletePost}
                   />
                 ))
               ) : (
                 <div className="text-center py-20 bg-surface-container-low/20 rounded-[2.5rem] border border-dashed border-outline-variant/20">
                   <p className="font-headlines font-bold text-on-surface-variant mb-4 font-body">No exhibits yet in this gallery.</p>
                   {isApproved ? (
                      <p className="text-xs text-on-surface-variant/60 font-body">Be the first to curate an exhibit above!</p>
                   ) : (
                      <Button variant="secondary" onClick={requestJoin}>Request to Curate</Button>
                   )}
                 </div>
               )}
            </div>

            {/* About Section */}
            <div className="lg:col-span-4">
              <div className="bg-surface-container-low/30 p-8 rounded-[2.5rem] border border-outline-variant/10 sticky top-24">
                <h3 className="font-headlines font-black text-lg mb-4 flex items-center gap-2 text-on-surface">
                  <span className="material-symbols-outlined text-primary">info</span> About Gallery
                </h3>
                <p className="text-sm font-body text-on-surface-variant leading-relaxed mb-6">
                  {community.description}
                </p>
                <div className="space-y-4 pt-6 border-t border-outline-variant/10">
                   <div className="flex items-center justify-between font-headlines">
                     <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Collectors</span>
                     <span className="text-sm font-black text-primary">{community.member_count || 0}</span>
                   </div>
                   <div className="flex items-center justify-between font-headlines">
                     <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Followers</span>
                     <span className="text-sm font-black text-secondary">{community.follower_count || 0}</span>
                   </div>
                   <div className="flex items-center justify-between font-headlines">
                     <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Founded</span>
                     <span className="text-xs font-bold text-on-surface">{new Date(community.created_at).getFullYear()}</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {(isOwner || membershipStatus === 'approved') && (
        <CreatePostFAB 
          onClick={() => postFormRef.current?.open()} 
          label="Exhibit Works"
        />
      )}
    </div>
  );
}

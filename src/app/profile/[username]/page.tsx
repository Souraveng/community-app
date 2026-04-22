'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '../../../components/layout/Navbar';
import Sidebar from '../../../components/layout/Sidebar';
import Image from 'next/image';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { useProfile } from '../../../hooks/useProfile';
import { useFollows } from '../../../hooks/useFollows';
import { useDirectMessages } from '../../../hooks/useDirectMessages';
import { useUserCommunities } from '../../../hooks/useUserCommunities';
import { uploadFile } from '../../../lib/storage';
import { usePosts } from '../../../hooks/usePosts';
import PostCard from '../../../components/common/PostCard';
import { useMarketplace } from '../../../hooks/useMarketplace';
import MarketListingCard from '../../../components/marketplace/MarketListingCard';
import { formatDistanceToNow } from 'date-fns';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile(username);
  const { isFollowing, followerCount, followingCount, follow, unfollow, loading: followLoading } = useFollows(profile?.id);
  const { createConversation } = useDirectMessages();
  const { posts, loading: postsLoading, deletePost } = usePosts(undefined, 'latest', profile?.id);
  const router = useRouter();

  const isOwnProfile = currentUser?.uid === profile?.id || currentUser?.displayName === profile?.username;
  
  // Debug profile ownership
  useEffect(() => {
    if (currentUser && profile) {
      console.log('Ownership Check:', {
        currentUserUID: currentUser.uid,
        profileID: profile.id,
        isOwnProfile
      });
    }
  }, [currentUser, profile, isOwnProfile]);

  
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    full_name: '',
    bio: '',
    username: '',
    last_username_change: null as string | null
  });
  const [activeTab, setActiveTab] = useState<'Collection' | 'Saved' | 'Communities' | 'Drafts' | 'Marketplace'>('Collection');
  const [showConnections, setShowConnections] = useState<'followers' | 'following' | null>(null);
  const [connectionList, setConnectionList] = useState<any[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const { communities, loading: communitiesLoading } = useUserCommunities(profile?.id);
  const [existingConversation, setExistingConversation] = useState<any>(null);

  useEffect(() => {
    const fetchConv = async () => {
      if (!currentUser?.uid || !profile?.id) return;
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', [currentUser.uid, profile.id])
        .maybeSingle();
      setExistingConversation(data);
    };
    fetchConv();
  }, [currentUser, profile]);


  const handleStartEdit = () => {
    if (profile) {
      setEditData({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        username: profile.username || '',
        last_username_change: profile.last_username_change || null
      });
      setIsEditing(true);
      setUsernameAvailable(null);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    try {
      // 1. Check Username constraint if changed
      if (editData.username !== profile?.username) {
        if (usernameAvailable === false) {
           alert('Username is taken.');
           return;
        }

        // 30-day lock check
        if (profile?.last_username_change) {
          const lastChange = new Date(profile.last_username_change);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          if (lastChange > thirtyDaysAgo) {
            const daysLeft = Math.ceil((lastChange.getTime() - thirtyDaysAgo.getTime()) / (1000 * 60 * 60 * 24));
            alert(`Identity lock active. You can change your username in ${daysLeft} days.`);
            return;
          }
        }
      }

      let avatarUrl = profile?.avatar_url;

      if (avatarFile && currentUser) {
        const path = `avatars/${currentUser.uid}/${Date.now()}_${avatarFile.name}`;
        avatarUrl = await uploadFile('avatars', path, avatarFile);
      }

      // Update payload
      const payload: any = {
        full_name: editData.full_name,
        bio: editData.bio,
        avatar_url: avatarUrl,
        username: editData.username,
      };

      // Only update last_change if username actually changed
      if (editData.username !== profile?.username) {
        payload.last_username_change = new Date().toISOString();
      }

      const result = await updateProfile(payload);
      
      if (!result) throw new Error('Update failed');

      setIsEditing(false);
      setAvatarFile(null);
      setPreviewUrl(null);
      
      if (editData.username !== username) {
        router.push(`/profile/${editData.username}`);
      }
    } catch (err: any) {
      console.error('Profile Update Error:', err);
      alert(err.message || 'Failed to update profile.');
    }
  };

  const handleMessage = async () => {
    if (!profile) return;
    try {
      const convId = await createConversation(profile.id);
      if (convId) {
        router.push('/chat');
      }
    } catch (err) {
      console.error('Error starting conversation:', err);
    }
  };

  // Real-time Username Check
  useEffect(() => {
    if (!isEditing || editData.username === profile?.username || editData.username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const check = async () => {
      setCheckingUsername(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', editData.username)
          .single();
        
        if (error && error.code === 'PGRST116') {
          setUsernameAvailable(true);
        } else {
          setUsernameAvailable(false);
        }
      } catch (err) {
        console.error('Error checking username:', err);
      } finally {
        setCheckingUsername(false);
      }
    };

    const timer = setTimeout(check, 500);
    return () => clearTimeout(timer);
  }, [editData.username, isEditing, profile?.username]);

  // Fetch Saved Posts
  useEffect(() => {
    const fetchSaved = async () => {
      if (activeTab !== 'Saved' || !profile) return;
      setSavedLoading(true);
      try {
        const { data, error } = await supabase
          .from('saved_posts')
          .select('post_id, posts(*)')
          .eq('user_id', profile.id);
        
        if (error) throw error;
        
        const mappedPosts = (data as any[]).map(item => ({
          ...item.posts,
          id: item.post_id // Ensure ID matches
        }));
        
        setSavedPosts(mappedPosts);
      } catch (err) {
        console.error('Error fetching saved:', err);
      } finally {
        setSavedLoading(false);
      }
    };

    fetchSaved();
  }, [activeTab, profile]);

  useEffect(() => {
    const fetchConnections = async () => {
      if (!showConnections || !profile) return;
      setLoadingConnections(true);
      try {
        let data;
        if (showConnections === 'followers') {
          const { data: follows, error } = await supabase
            .from('follows')
            .select('follower_id, profiles!follows_follower_id_fkey(*)')
            .eq('following_id', profile.id);
          if (error) throw error;
          data = (follows as any[]).map((f: any) => f.profiles);
        } else {
          const { data: follows, error } = await supabase
            .from('follows')
            .select('following_id, profiles!follows_following_id_fkey(*)')
            .eq('follower_id', profile.id);
          if (error) throw error;
          data = (follows as any[]).map((f: any) => f.profiles);
        }
        setConnectionList(data || []);
      } catch (err) {
        console.error('Error fetching connections:', err);
      } finally {
        setLoadingConnections(false);
      }
    };

    fetchConnections();
  }, [showConnections, profile]);

  if (profileLoading) return <div className="min-h-screen bg-background flex items-center justify-center font-headlines text-2xl"><Navbar />Analyzing Curator...</div>;
  
  if (!profile) return (
    <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4">
      <Navbar />
      <p className="font-headlines text-2xl text-on-surface">Curator not found.</p>
      <Button variant="primary" onClick={() => router.push('/home')}>Back to Home</Button>
    </div>
  );

  const stats = [
    { label: 'Exhibits', value: posts.length.toString(), icon: 'gallery_thumbnail' },
    { label: 'Following', value: followingCount.toString(), icon: 'group' },
    { label: 'Followers', value: followerCount.toString(), icon: 'diversity_3' },
    { label: 'Curation Score', value: '890', icon: 'award_star' }
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Navbar />
      
      <div className="flex pt-16">
        <Sidebar mb-visible={false} />
        
        <main className="flex-1 ml-0 lg:ml-64 p-4 md:p-12 max-w-6xl mx-auto w-full">
          {/* Header Profile Section */}
          <div className="relative mb-16">
            <div className="h-41 md:h-64 w-full rounded-[2.5rem] md:rounded-[3.5rem] bg-gradient-to-tr from-surface-container-highest via-primary/5 to-secondary/5 border border-outline-variant/10 ambient-shadow overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
            </div>
            
            <div className="absolute -bottom-12 left-8 md:left-12 flex items-end gap-5 md:gap-8">
              <div className="w-24 h-24 md:w-36 md:h-36 rounded-3xl md:rounded-[2rem] bg-surface-container-lowest p-2 ambient-shadow border border-outline-variant/10 group relative">
                <div className="w-full h-full rounded-2xl md:rounded-[1.5rem] overflow-hidden relative">
                  {previewUrl || profile.avatar_url ? (
                    <Image 
                      src={previewUrl || profile.avatar_url || ''} 
                      alt={profile.username} 
                      fill 
                      className="object-cover"
                      sizes="(max-width: 768px) 100px, 150px"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-primary">person</span>
                    </div>
                  )}
                </div>
                {isOwnProfile && isEditing && (
                   <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="material-symbols-outlined text-white">photo_camera</span>
                      <input 
                        id="avatar-upload"
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                   </label>
                )}
              </div>
              
              <div className="mb-4">
                <h1 className="text-xl md:text-4xl font-extrabold font-headlines tracking-tighter mb-0.5">
                  {profile.full_name || profile.username}
                </h1>
                <p className="text-xs md:text-base font-bold text-primary flex items-center gap-1.5 uppercase tracking-widest opacity-80">
                  u/{profile.username} <span className="material-symbols-outlined text-sm">verified</span>
                </p>
              </div>
            </div>

            <div className="absolute -bottom-10 right-8 md:right-12 flex items-center gap-4">
              {isOwnProfile ? (
                 <div className="flex items-center gap-6">
                   <div className="hidden md:flex gap-4 mr-4">
                      <div className="text-center cursor-pointer hover:opacity-70 transition-opacity" onClick={() => setShowConnections('followers')}>
                        <p className="text-xl font-black font-headlines tracking-tighter">{followerCount}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Followers</p>
                      </div>
                      <div className="text-center cursor-pointer hover:opacity-70 transition-opacity" onClick={() => setShowConnections('following')}>
                        <p className="text-xl font-black font-headlines tracking-tighter">{followingCount}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Following</p>
                      </div>
                   </div>
                   {isEditing ? (
                    <>
                      <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                      <Button variant="primary" onClick={handleSave}>Save Changes</Button>
                    </>
                  ) : (
                    <Button variant="secondary" className="px-6 md:px-8" onClick={handleStartEdit}>
                      <span className="material-symbols-outlined text-sm mr-2">edit</span> Edit Profile
                    </Button>
                  )}
                 </div>
              ) : (
                <div className="flex gap-4">
                   <div className="relative group">
                    <Button 
                      variant="ghost" 
                      className={`w-12 h-12 p-0 rounded-2xl flex items-center justify-center border border-outline-variant/10 ${existingConversation?.status === 'pending' ? 'text-secondary' : ''}`}
                      onClick={handleMessage}
                    >
                      <span className="material-symbols-outlined">{existingConversation?.status === 'pending' ? 'hourglass_empty' : 'forum'}</span>
                    </Button>
                    {existingConversation?.status === 'pending' && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-secondary text-on-secondary text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Request Pending
                      </div>
                    )}
                  </div>
                  <Button 
                    variant={isFollowing ? 'secondary' : 'primary'} 
                    className="px-8 md:px-12 py-4"
                    onClick={isFollowing ? unfollow : follow}
                    disabled={followLoading}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                </div>
              )}
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 mt-16 md:mt-24">
            {/* Left Column: Info */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-surface-container-low/30 p-8 rounded-[2.5rem] border border-outline-variant/10 shadow-sm">
                <h3 className="font-headlines font-extrabold text-xl mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">info</span> Manifesto
                </h3>
                {isEditing ? (
                  <div className="space-y-4">
                    <Input 
                      label="Visual Name" 
                      value={editData.full_name} 
                      onChange={(e) => setEditData({...editData, full_name: e.target.value})} 
                    />
                    <div className="space-y-2">
                      <Input 
                        label="Username" 
                        value={editData.username} 
                        onChange={(e) => setEditData({...editData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})} 
                        error={usernameAvailable === false ? 'This handle is taken.' : undefined}
                      />
                      {checkingUsername && <p className="text-[10px] text-primary animate-pulse ml-1">Checking availability...</p>}
                      {usernameAvailable === true && <p className="text-[10px] text-green-500 ml-1">Identity handle available.</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant ml-1 uppercase tracking-widest">Manifesto</label>
                      <textarea 
                        className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-4 text-sm font-body text-on-surface min-h-[120px] focus:ring-1 focus:ring-primary"
                        value={editData.bio}
                        onChange={(e) => setEditData({...editData, bio: e.target.value})}
                        placeholder="Describe your creative vision..."
                      />
                    </div>
                  </div>
                ) : (
                  <p className="font-body text-on-surface-variant leading-relaxed text-base italic opacity-80">
                    "{profile.bio || 'This curator has not yet defined their manifesto.'}"
                  </p>
                )}
                
                <div className="mt-8 pt-8 border-t border-outline-variant/10 space-y-4">
                  <div className="flex items-center gap-3 text-sm font-bold text-on-surface">
                    <span className="material-symbols-outlined text-primary-container text-lg">calendar_today</span> Joined April 2024
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-on-surface">
                    <span className="material-symbols-outlined text-primary-container text-lg">public</span> Global Curator
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, i) => (
                  <div 
                    key={i} 
                    className="bg-surface-container-low/30 p-6 rounded-[2rem] border border-outline-variant/10 text-center hover:ambient-shadow transition-all group cursor-pointer"
                    onClick={() => {
                      if (stat.label === 'Followers' || stat.label === 'Following') {
                        setShowConnections(stat.label.toLowerCase() as any);
                      }
                    }}
                  >
                    <span className="material-symbols-outlined text-primary mb-2 opacity-50 group-hover:opacity-100 transition-opacity">{stat.icon}</span>
                    <div className="text-2xl font-black font-headlines tracking-tighter">{stat.value}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Feed/Content */}
            <div className="lg:col-span-8">
                <div className="flex items-center gap-6 md:gap-10 border-b border-outline-variant/10 mb-8 md:mb-10 pb-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                  {(['Collection', 'Marketplace', 'Communities', isOwnProfile && 'Saved', isOwnProfile && 'Drafts'].filter(Boolean) as string[]).map((tab) => (
                    <button 
                      key={tab} 
                      onClick={() => setActiveTab(tab as any)}
                      className={`pb-4 text-[10px] md:text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                    >
                      {tab}
                      {activeTab === tab && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full animate-in fade-in slide-in-from-bottom-1" />
                      )}
                    </button>
                  ))}
                </div>

               {activeTab === 'Collection' && (
                 <div className="flex flex-col gap-8">
                   {postsLoading ? (
                     <div className="py-12 flex flex-col items-center gap-4 text-on-surface-variant">
                        <span className="material-symbols-outlined animate-spin text-4xl">sync</span>
                        <p className="font-headlines font-bold uppercase tracking-widest">Gathering Exhibits...</p>
                     </div>
                   ) : posts.length > 0 ? (
                     posts.map((post) => (
                        <PostCard 
                          key={post.id}
                          id={post.id}
                          user={post.username}
                          userId={post.user_id}
                          avatar={post.user_avatar}
                          timestamp={post.created_at}
                         community={post.community_name}
                         title={post.title}
                         content={post.content}
                         image={post.image_url}
                         videoUrl={post.video_url}
                         comments={post.comment_count || 0}
                         votes={post.upvotes || 0}
                         showDelete={isOwnProfile}
                         onDelete={deletePost}
                       />
                     ))
                   ) : (
                     <div className="py-20 text-center bg-surface-container-low/20 rounded-[3rem] border border-dashed border-outline-variant/20">
                        <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4 opacity-30">collections</span>
                        <p className="text-on-surface-variant font-headlines font-bold uppercase tracking-widest">No Exhibits Yet</p>
                        <p className="text-sm text-on-surface-variant/60 mt-2">Start sharing your creative vision with the world.</p>
                        {isOwnProfile && (
                          <Button variant="primary" className="mt-6" onClick={() => router.push('/create-post')}>Create First Exhibit</Button>
                        )}
                     </div>
                   )}
                 </div>
               )}

               {activeTab === 'Communities' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {communitiesLoading ? (
                     <div className="col-span-2 py-12 flex flex-col items-center gap-4 text-on-surface-variant">
                       <span className="material-symbols-outlined animate-spin text-4xl">sync</span>
                       <p className="font-headlines font-bold uppercase tracking-widest">Scanning Networks...</p>
                     </div>
                   ) : communities.length > 0 ? (
                     communities.map((comm) => (
                       <div 
                         key={comm.name} 
                         className="flex flex-col gap-4 p-6 rounded-[2.5rem] bg-surface-container-low/30 border border-outline-variant/10 hover:ambient-shadow transition-all group cursor-pointer"
                         onClick={() => router.push(`/community/${comm.name}`)}
                       >
                         <div className="flex items-center gap-4">
                           <div className="w-16 h-16 rounded-[1.2rem] overflow-hidden relative border border-outline-variant/10">
                             {comm.avatar_url ? (
                               <Image src={comm.avatar_url} alt={comm.name} fill className="object-cover" />
                             ) : (
                               <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                                 <span className="material-symbols-outlined text-3xl">groups</span>
                               </div>
                             )}
                           </div>
                           <div className="flex-1">
                             <h4 className="font-headlines font-black text-lg tracking-tight group-hover:text-primary transition-colors">{comm.name}</h4>
                             <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{comm.member_count} Members</p>
                           </div>
                         </div>
                         <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed opacity-70">
                           {comm.description || 'Welcome to this gallery of creativity and curation.'}
                         </p>
                       </div>
                     ))
                   ) : (
                     <div className="col-span-2 py-20 text-center bg-surface-container-low/20 rounded-[3rem] border border-dashed border-outline-variant/20">
                       <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4 opacity-30">explore</span>
                       <p className="text-on-surface-variant font-headlines font-bold uppercase tracking-widest">No Communities Found</p>
                       <p className="text-sm text-on-surface-variant/60 mt-2">Start your journey by joining or building a gallery.</p>
                       <Button variant="ghost" className="mt-6" onClick={() => router.push('/home')}>Explore All</Button>
                     </div>
                   )}
                 </div>
               )}

               {activeTab === 'Saved' && (
                 <div className="flex flex-col gap-8">
                   {savedLoading ? (
                     <div className="py-12 flex flex-col items-center gap-4 text-on-surface-variant">
                        <span className="material-symbols-outlined animate-spin text-4xl">sync</span>
                        <p className="font-headlines font-bold uppercase tracking-widest">Recalling Saved Works...</p>
                     </div>
                   ) : savedPosts.length > 0 ? (
                     savedPosts.map((post) => (
                        <PostCard 
                          key={post.id}
                          id={post.id}
                          user={post.username}
                          userId={post.user_id}
                          avatar={post.user_avatar}
                          timestamp={post.created_at}
                         community={post.community_name}
                         title={post.title}
                         content={post.content}
                         image={post.image_url}
                         videoUrl={post.video_url}
                         comments={post.comment_count || 0}
                         votes={post.upvotes || 0}
                         showDelete={false}
                       />
                     ))
                   ) : (
                     <div className="py-20 text-center bg-surface-container-low/20 rounded-[3rem] border border-dashed border-outline-variant/20">
                        <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4 opacity-30">bookmark</span>
                        <p className="text-on-surface-variant font-headlines font-bold uppercase tracking-widest">No Saved Exhibits</p>
                        <p className="text-sm text-on-surface-variant/60 mt-2">Start your collection by saving the intelligence you love.</p>
                     </div>
                   )}
                 </div>
               )}

                {activeTab === 'Drafts' && (
                  <div className="py-24 text-center">
                    <p className="text-on-surface-variant font-headlines font-bold uppercase tracking-widest opacity-40">Coming Soon to your Space</p>
                  </div>
                )}

                {activeTab === 'Marketplace' && (
                  <MarketplaceTab userId={profile?.id} />
                )}
            </div>

          </div>

          {/* Connections List Overlay */}
          {showConnections && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" onClick={() => setShowConnections(null)} />
              <div className="relative w-full max-w-lg bg-surface-container-low border border-outline-variant/10 rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black font-headlines tracking-tighter capitalize">{showConnections}</h2>
                  <button onClick={() => setShowConnections(null)} className="w-10 h-10 rounded-full hover:bg-surface-container-highest transition-colors flex items-center justify-center">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4 scrollbar-hide">
                  {loadingConnections ? (
                    <div className="flex justify-center py-12">
                      <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                    </div>
                  ) : connectionList.length > 0 ? (
                    connectionList.map((connUser) => (
                      <div 
                        key={connUser.id} 
                        className="flex items-center justify-between p-4 rounded-3xl bg-surface-container-low hover:bg-surface-container-lowest transition-all group border border-transparent hover:border-outline-variant/10 cursor-pointer"
                        onClick={() => {
                          setShowConnections(null);
                          router.push(`/profile/${connUser.username}`);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden relative border border-outline-variant/5">
                            {connUser.avatar_url ? (
                              <Image src={connUser.avatar_url} alt={connUser.username} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">person</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-on-surface">{connUser.full_name || connUser.username}</p>
                            <p className="text-xs font-bold text-primary opacity-60 uppercase tracking-widest">u/{connUser.username}</p>
                          </div>
                        </div>
                        <span className="material-symbols-outlined opacity-0 group-hover:opacity-100 transition-opacity text-primary">arrow_forward</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-on-surface-variant font-medium">No results found.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function MarketplaceTab({ userId }: { userId?: string }) {
  const { listings, loading } = useMarketplace();
  const userListings = listings.filter(l => l.user_id === userId);

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square rounded-[2.5rem] bg-surface-container-low animate-pulse" />
          ))}
        </div>
      ) : userListings.length === 0 ? (
        <div className="py-20 text-center bg-surface-container-low/20 rounded-[3rem] border border-dashed border-outline-variant/20">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4 opacity-30">storefront</span>
          <p className="text-on-surface-variant font-headlines font-bold uppercase tracking-widest">No Active Listings</p>
          <p className="text-sm text-on-surface-variant/60 mt-2">Browse the marketplace to start your auction journey.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {userListings.map(listing => (
            <MarketListingCard key={listing.id} listing={listing} isOwner={true} />
          ))}
        </div>
      )}
    </div>
  );
}

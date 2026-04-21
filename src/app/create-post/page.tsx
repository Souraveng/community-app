'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { supabase } from '../../lib/supabase';
import { uploadFile } from '../../lib/storage';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';

const CATEGORIES = [
  'Design',
  'Photography',
  'Architecture',
  'Art',
  'Fashion',
  'Travel',
  'Nature',
  'Technology'
];

function CreatePostPageContent() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const communityParam = searchParams.get('community');
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Design');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (communityParam) {
      const cat = communityParam.startsWith('c:') ? communityParam.replace('c:', '') : communityParam;
      if (CATEGORIES.includes(cat)) {
        setSelectedCategory(cat);
      }
    }
  }, [communityParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError('');
    setUploadProgress('Analyzing media...');

    try {
      let imageUrl = '';
      let videoUrl = '';

      if (imageFile) {
        setUploadProgress('Uploading cover image...');
        const path = `posts/${profile.id}/${Date.now()}-${imageFile.name}`;
        imageUrl = await uploadFile('post-media', path, imageFile);
      }

      if (videoFile) {
        setUploadProgress('Uploading motion clip...');
        const path = `posts/${profile.id}/${Date.now()}-${videoFile.name}`;
        videoUrl = await uploadFile('post-media', path, videoFile);
      }

      const { error: postError } = await supabase.from('posts').insert({
        user_id: profile.id,
        username: profile.username,
        user_avatar: profile.avatar_url,
        title,
        content,
        image_url: imageUrl,
        video_url: videoUrl,
        community_name: `c:${selectedCategory}`,
        upvotes: 0,
        comment_count: 0
      });

      if (postError) throw postError;

      router.push('/home');
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to publish exhibit');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex pt-16">
        <Sidebar />
        
        <main className="flex-1 ml-0 md:ml-64 p-8 md:p-12 max-w-4xl mx-auto">
          {/* Header Restoration from Screenshot */}
          <div className="mb-10">
            <h1 className="text-5xl font-extrabold font-headlines text-on-surface tracking-tighter mb-2">Create New Exhibit</h1>
            <p className="text-on-surface-variant/60 font-body text-lg">Share your discovery with the community.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10 bg-white/40 backdrop-blur-sm p-10 rounded-[3rem] border border-outline-variant/10 shadow-xl shadow-on-background/5">
            <div className="space-y-8">
              {/* Title Section */}
              <div className="space-y-3">
                <label className="text-sm font-headlines font-bold text-on-surface/80 ml-1">Title</label>
                <input
                  type="text"
                  placeholder="What's this discovery about?"
                  className="w-full bg-surface-container-low/50 border-none rounded-2xl py-5 px-6 text-base font-medium text-on-surface placeholder:text-on-surface-variant/30 focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all shadow-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Community Selector */}
              <div className="space-y-3">
                <label className="text-sm font-headlines font-bold text-on-surface/80 ml-1">Community</label>
                <div className="relative">
                  <select
                    className="w-full bg-surface-container-low/50 border-none rounded-2xl py-5 px-6 text-base font-medium text-on-surface appearance-none focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all shadow-sm cursor-pointer"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/40">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Media Grid Restoration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Cover Image</label>
                  <div 
                    className={`relative rounded-3xl border-2 border-dashed aspect-video flex flex-col items-center justify-center gap-3 overflow-hidden transition-all group cursor-pointer ${
                      imageFile ? 'border-primary bg-primary/5' : 'border-outline-variant/20 bg-surface-container-low/20 hover:border-primary/40 hover:bg-white'
                    }`}
                    onClick={() => document.getElementById('page-image-input')?.click()}
                  >
                    {imageFile ? (
                      <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-4xl text-on-surface/20 group-hover:text-primary transition-colors">add_photo_alternate</span>
                        <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Select Visual</span>
                      </>
                    )}
                    <input id="page-image-input" type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary ml-1">Motion Video (2MB Limit)</label>
                  <div 
                    className={`relative rounded-3xl border-2 border-dashed aspect-video flex flex-col items-center justify-center gap-3 overflow-hidden transition-all group cursor-pointer ${
                      videoFile ? 'border-secondary bg-secondary/5' : 'border-outline-variant/20 bg-surface-container-low/20 hover:border-secondary/40 hover:bg-white'
                    }`}
                    onClick={() => document.getElementById('page-video-input')?.click()}
                  >
                    {videoFile ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-secondary">movie</span>
                        <span className="text-[10px] font-bold text-secondary px-6 truncate w-full text-center">{videoFile.name}</span>
                      </div>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-4xl text-on-surface/20 group-hover:text-secondary transition-colors">movie</span>
                        <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Select Motion</span>
                      </>
                    )}
                    <input id="page-video-input" type="file" accept="video/*" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
                  </div>
                </div>
              </div>

              {/* Composition Section */}
              <div className="space-y-3">
                <label className="text-sm font-headlines font-bold text-on-surface/80 ml-1">Composition</label>
                <textarea
                  placeholder="Describe your find..."
                  className="w-full bg-surface-container-low/50 border-none rounded-[2rem] py-8 px-8 min-h-[220px] text-base font-medium text-on-surface placeholder:text-on-surface-variant/30 focus:ring-2 focus:ring-primary/10 focus:bg-white resize-none transition-all shadow-sm"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-error text-sm font-bold bg-error/5 p-5 rounded-2xl border border-error/10 animate-in slide-in-from-top-2">{error}</p>}
              {loading && (
                <div className="flex items-center gap-4 text-primary bg-primary/5 p-4 rounded-2xl animate-pulse">
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] leading-none">{uploadProgress}</p>
                </div>
              )}
            </div>

            {/* Footer Buttons (Polished Aesthetics) */}
            <div className="flex items-center justify-end gap-10 pt-8 border-t border-outline-variant/10">
              <button 
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-on-surface-variant/40 font-bold text-[10px] uppercase tracking-[0.3em] hover:text-on-surface transition-all"
              >
                Discard Changes
              </button>
              <button 
                type="submit" 
                disabled={loading || !title || !content}
                className="px-14 py-5 rounded-full bg-primary text-on-primary font-headlines font-black text-[10px] uppercase tracking-[0.4em] shadow-[0_20px_40px_-12px_rgba(172,44,0,0.4)] hover:brightness-110 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale disabled:scale-100 disabled:shadow-none border border-primary/20"
              >
                {loading ? 'Publishing...' : 'Publish Exhibit'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

export default function CreatePostPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-t-2 border-primary rounded-full animate-spin"></div>
        <p className="font-headlines font-black uppercase text-[10px] tracking-widest opacity-50 italic">Initializing Curation Studio...</p>
      </div>
    }>
      <CreatePostPageContent />
    </Suspense>
  );
}

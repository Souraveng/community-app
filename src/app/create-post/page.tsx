'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { supabase } from '../../lib/supabase';
import { uploadFile } from '../../lib/storage';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function CreatePostPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [community, setCommunity] = useState('Design');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [communities, setCommunities] = useState<any[]>([]);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    const { data } = await supabase.from('communities').select('name');
    if (data) setCommunities(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    
    setLoading(true);
    setUploadProgress('Preparing upload...');
    
    try {
      let imageUrl = null;
      let videoUrl = null;

      // 1. Upload Image if selected
      if (imageFile) {
        setUploadProgress('Uploading visual...');
        const path = `posts/${user.uid}/${Date.now()}_${imageFile.name}`;
        imageUrl = await uploadFile('avatars', path, imageFile, { maxSizeMB: 5 });
      }

      // 2. Upload Video if selected
      if (videoFile) {
        setUploadProgress('Uploading motion...');
        const path = `posts/${user.uid}/${Date.now()}_${videoFile.name}`;
        videoUrl = await uploadFile('avatars', path, videoFile, { maxSizeMB: 20 });
      }

      // 3. Create Post
      setUploadProgress('Publishing to network...');
      const { error } = await supabase.from('posts').insert({
        title,
        content,
        community_name: community,
        image_url: imageUrl,
        video_url: videoUrl,
        user_id: user.uid, // Required for database constraints and RLS
        username: profile.username,
        user_avatar: profile.avatar_url,
        upvotes: 0,
        comment_count: 0
      });

      if (error) throw error;
      router.push('/home');
    } catch (err: any) {
      console.error('Error creating post:', err);
      alert(err.message || 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex pt-16">
        <Sidebar />
        
        <main className="flex-1 ml-0 md:ml-64 p-8 max-w-3xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-extrabold font-headlines text-on-surface tracking-tighter mb-2">Create New Exhibit</h1>
            <p className="text-on-surface-variant font-body">Share your discovery with the community.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 bg-surface-container-low/30 p-10 rounded-[2.5rem] border border-outline-variant/10 ambient-shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <Input 
                  label="Title" 
                  placeholder="What's this discovery about?" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1">Community</label>
                <select 
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary font-body text-on-surface"
                  value={community}
                  onChange={(e) => setCommunity(e.target.value)}
                >
                  {communities.length > 0 ? (
                    communities.map(c => (
                      <option key={c.name} value={c.name}>g/{c.name}</option>
                    ))
                  ) : (
                    <>
                      <option>Design</option>
                      <option>Architecture</option>
                      <option>Photography</option>
                    </>
                  )}
                </select>
              </div>

              {/* Media Picker */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-primary ml-1">Cover Image</label>
                    <div className="relative group border-2 border-dashed border-outline-variant/20 rounded-3xl p-6 hover:border-primary/40 transition-all text-center">
                       <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                       />
                       <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2 group-hover:text-primary transition-colors">add_photo_alternate</span>
                       <p className="text-xs font-bold text-on-surface-variant group-hover:text-on-surface">
                         {imageFile ? imageFile.name : 'Select Visual'}
                       </p>
                    </div>
                 </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-secondary ml-1">Motion Video (2MB Limit)</label>
                    <div className={`relative group border-2 border-dashed rounded-3xl p-6 transition-all text-center ${error && videoFile ? 'border-error/40 bg-error/5' : 'border-outline-variant/20 hover:border-secondary/40'}`}>
                       <input 
                        type="file" 
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          if (file && file.size > 2 * 1024 * 1024) {
                            setError('Video exceeds 2MB limit. Please compress or choose a shorter clip.');
                            setVideoFile(file);
                          } else {
                            setError('');
                            setVideoFile(file);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                       />
                       <span className={`material-symbols-outlined text-3xl mb-2 transition-colors ${error && videoFile ? 'text-error' : 'text-on-surface-variant group-hover:text-secondary'}`}>movie</span>
                       <p className={`text-xs font-bold ${error && videoFile ? 'text-error' : 'text-on-surface-variant group-hover:text-on-surface'}`}>
                         {videoFile ? videoFile.name : 'Select Motion'}
                       </p>
                    </div>
                    {error && videoFile && <p className="text-[10px] text-error font-bold mt-1 ml-1">{error}</p>}
                 </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-on-surface-variant ml-1">Composition</label>
              <textarea 
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-primary min-h-[200px] font-body text-on-surface placeholder:text-on-surface-variant/40" 
                placeholder="Describe your find..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              ></textarea>
            </div>

            {loading && (
              <div className="flex items-center gap-4 text-primary font-bold text-sm animate-pulse">
                <span className="material-symbols-outlined animate-spin">sync</span>
                {uploadProgress}
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={loading || !!error}>
                {loading ? 'Curating...' : 'Publish Exhibit'}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { supabase } from '../../lib/supabase';
import { uploadFile } from '../../lib/storage';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import Button from './Button';

export interface PostFormHandle {
  open: () => void;
}

interface PostFormProps {
  mode: 'global' | 'community';
  layout?: 'bar' | 'box';
  communityName?: string;
  onPostCreated?: () => void;
  onCancel?: () => void;
}

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

const PostForm = forwardRef<PostFormHandle, PostFormProps>(({ 
  mode, 
  layout = 'bar', 
  communityName, 
  onPostCreated,
  onCancel 
}, ref) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Design');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [collapsed, setCollapsed] = useState(layout === 'bar');

  const isBox = layout === 'box';

  useImperativeHandle(ref, () => ({
    open: () => {
      setCollapsed(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }));

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
        setUploadProgress('Uploading image...');
        const path = `posts/${profile.id}/${Date.now()}-${imageFile.name}`;
        imageUrl = await uploadFile('avatars', path, imageFile);
      }

      if (videoFile) {
        setUploadProgress('Uploading video...');
        const path = `posts/${profile.id}/${Date.now()}-${videoFile.name}`;
        videoUrl = await uploadFile('avatars', path, videoFile);
      }

      const finalCommunity = mode === 'global' ? `c:${selectedCategory}` : communityName;

      const { error: postError } = await supabase.from('posts').insert({
        user_id: profile.id,
        username: profile.username,
        user_avatar: profile.avatar_url,
        title,
        content,
        image_url: imageUrl,
        video_url: videoUrl,
        community_name: finalCommunity,
        upvotes: 0,
        comment_count: 0
      });

      if (postError) throw postError;

      // Reset
      setTitle('');
      setContent('');
      setImageFile(null);
      setVideoFile(null);
      
      if (layout === 'bar') {
        setCollapsed(true);
      }
      
      if (onPostCreated) onPostCreated();
      
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to create post');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  if (!user) return null;

  // Render logic for Global Modal (PIXEL PERFECT RESTORATION)
  if (isBox) {
    return (
      <div className="flex flex-col">
        <form onSubmit={handleSubmit} className="space-y-8 p-4">
          <div className="space-y-6">
            {/* Title Section */}
            <div className="space-y-3">
              <label className="text-sm font-headlines font-bold text-on-surface/80">Title</label>
              <input
                type="text"
                placeholder="What's this discovery about?"
                className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/10 transition-all"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Community Section */}
            <div className="space-y-3">
              <label className="text-sm font-headlines font-bold text-on-surface/80">Community</label>
              <div className="relative">
                <select
                  className="w-full bg-surface-container-low border-none rounded-xl py-4 px-6 text-sm font-medium text-on-surface appearance-none focus:ring-2 focus:ring-primary/10 cursor-pointer"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/60">
                  expand_more
                </span>
              </div>
            </div>

            {/* Media Section */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary">Cover Image</label>
                <div 
                  className={`relative rounded-2xl border-2 border-dashed aspect-[16/9] flex flex-col items-center justify-center gap-3 overflow-hidden transition-all group cursor-pointer ${
                    imageFile ? 'border-primary bg-primary/5' : 'border-outline-variant/30 bg-white/50 hover:bg-surface-container-low'
                  }`}
                  onClick={() => document.getElementById('global-image-input')?.click()}
                >
                  {imageFile ? (
                    <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-4xl text-on-surface/40 group-hover:text-primary transition-colors">add_photo_alternate</span>
                      <span className="text-[10px] font-bold text-on-surface-variant/60">Select Visual</span>
                    </>
                  )}
                  <input id="global-image-input" type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-secondary">Motion Video (2MB Limit)</label>
                <div 
                  className={`relative rounded-2xl border-2 border-dashed aspect-[16/9] flex flex-col items-center justify-center gap-3 overflow-hidden transition-all group cursor-pointer ${
                    videoFile ? 'border-secondary bg-secondary/5' : 'border-outline-variant/30 bg-white/50 hover:bg-surface-container-low'
                  }`}
                  onClick={() => document.getElementById('global-video-input')?.click()}
                >
                  {videoFile ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-secondary">movie</span>
                      <span className="text-[10px] font-bold text-secondary px-4 truncate w-full text-center">{videoFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-4xl text-on-surface/40 group-hover:text-secondary transition-colors">movie</span>
                      <span className="text-[10px] font-bold text-on-surface-variant/60">Select Motion</span>
                    </>
                  )}
                  <input id="global-video-input" type="file" accept="video/*" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
                </div>
              </div>
            </div>

            {/* Composition Section */}
            <div className="space-y-3">
              <label className="text-sm font-headlines font-bold text-on-surface/80">Composition</label>
              <textarea
                placeholder="Describe your find..."
                className="w-full bg-surface-container-low border-none rounded-2xl py-6 px-6 min-h-[160px] text-sm font-medium text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/10 resize-none transition-all"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            {error && <p className="text-error text-xs font-bold bg-error/5 p-4 rounded-xl border border-error/10">{error}</p>}
          </div>

          {/* Footer Action Bar */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-outline-variant/10">
            {onCancel && (
              <button 
                type="button"
                onClick={onCancel}
                className="px-6 py-2.5 text-on-surface-variant/60 font-bold text-[10px] uppercase tracking-[0.2em] hover:text-on-surface transition-colors"
              >
                Discard Changes
              </button>
            )}
            <button 
              type="submit" 
              disabled={loading || !title || !content}
              className="px-10 py-4 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-headlines font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100"
            >
              {loading ? uploadProgress || 'Publishing...' : 'Publish Exhibit'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Render logic for Inline Bar (Gallery Owners style) - PRESERVED
  return (
    <div className={`bg-surface-container-lowest rounded-2xl border border-outline-variant/10 overflow-hidden transition-all duration-500 ease-out mb-8 ${collapsed ? 'p-4' : 'p-8'} shadow-sm`}>
      {collapsed ? (
        <div 
          className="flex items-center gap-4 cursor-pointer group"
          onClick={() => setCollapsed(false)}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant/20 flex-shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="You" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {profile?.username?.[0] || '?'}
              </div>
            )}
          </div>
          <div className="flex-1 bg-surface-container-low rounded-full px-6 py-2.5 text-on-surface-variant/60 text-sm font-medium group-hover:bg-surface-container-high transition-colors">
            {mode === 'global' ? 'Share a discovery...' : `Exhibit something here...`}
          </div>
          <button className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg shadow-primary/10 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-sm">add</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 p-0.5">
                <img 
                  src={profile?.avatar_url || 'https://via.placeholder.com/150'} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-headlines font-bold text-on-surface tracking-tight">New Exhibit</h3>
                <p className="text-xs text-on-surface-variant font-medium">Curating as @{profile?.username}</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setCollapsed(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-on-surface-variant">close</span>
            </button>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Exhibit Title"
              className="w-full bg-transparent text-xl font-headlines font-extrabold text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            
            <textarea
              placeholder="Tell the story behind this collection..."
              className="w-full bg-transparent text-sm font-body text-on-surface-variant placeholder:text-on-surface-variant/30 focus:outline-none resize-none min-h-[100px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <div 
                className={`relative rounded-xl border-2 border-dashed border-outline-variant/30 aspect-video flex flex-col items-center justify-center gap-2 overflow-hidden group hover:border-primary/40 transition-colors cursor-pointer ${imageFile ? 'border-primary/40' : ''}`}
                onClick={() => document.getElementById('image-input')?.click()}
              >
                {imageFile ? (
                  <>
                    <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-bold">Change Image</span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-primary/60 transition-colors">image</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 group-hover:text-primary/60 transition-colors">Add Image</span>
                  </>
                )}
                <input 
                  id="image-input" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
              </div>

              <div 
                className={`relative rounded-xl border-2 border-dashed border-outline-variant/30 aspect-video flex flex-col items-center justify-center gap-2 overflow-hidden group hover:border-secondary/40 transition-colors cursor-pointer ${videoFile ? 'border-secondary/40' : ''}`}
                onClick={() => document.getElementById('video-input')?.click()}
              >
                {videoFile ? (
                  <div className="w-full h-full bg-secondary-container/20 flex flex-col items-center justify-center gap-2 px-4">
                    <span className="material-symbols-outlined text-secondary">movie</span>
                    <span className="text-[10px] font-bold text-secondary text-center truncate w-full">{videoFile.name}</span>
                  </div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-secondary/60 transition-colors">videocam</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 group-hover:text-secondary/60 transition-colors">Add Motion</span>
                  </>
                )}
                <input 
                  id="video-input" 
                  type="file" 
                  accept="video/*" 
                  className="hidden" 
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-outline-variant/10">
            <Button 
              type="submit" 
              disabled={loading || !title || !content}
              className="px-10"
            >
              {loading ? uploadProgress || 'Publishing...' : 'Publish Exhibit'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
});

PostForm.displayName = 'PostForm';

export default PostForm;

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
        imageUrl = await uploadFile('post-media', path, imageFile);
      }

      if (videoFile) {
        setUploadProgress('Uploading video...');
        const path = `posts/${profile.id}/${Date.now()}-${videoFile.name}`;
        videoUrl = await uploadFile('post-media', path, videoFile);
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

  // Render logic for Modal-style Box
  if (isBox) {
    return (
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
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

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Exhibit Title"
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-xl font-headlines font-extrabold text-on-surface placeholder:text-on-surface-variant/30 focus:border-primary focus:outline-none transition-all"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            
            <textarea
              placeholder="Tell the story behind this collection..."
              className="w-full bg-white/5 border border-white/10 rounded-[2rem] text-on-surface p-6 min-h-[160px] focus:border-primary transition-all outline-none placeholder:opacity-30 resize-none font-medium leading-relaxed"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            {(imageFile || videoFile) && (
              <div className="relative group rounded-[2.5rem] overflow-hidden border-2 border-primary/20 aspect-video bg-black/40">
                {imageFile && (
                  <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover animate-in fade-in zoom-in duration-700" />
                )}
                {videoFile && (
                  <video src={URL.createObjectURL(videoFile)} className="w-full h-full object-cover" autoPlay muted loop />
                )}
                <button 
                  type="button"
                  onClick={() => { setImageFile(null); setVideoFile(null); }}
                  className="absolute top-4 right-4 w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-xl text-white flex items-center justify-center hover:bg-error transition-all hover:scale-110 active:scale-95"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
              <div className="flex gap-2">
                <label className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 rounded-2xl cursor-pointer transition-all active:scale-95 group">
                  <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">image</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface">Image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { setImageFile(file); setVideoFile(null); }
                  }} />
                </label>
                <label className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 rounded-2xl cursor-pointer transition-all active:scale-95 group">
                  <span className="material-symbols-outlined text-secondary group-hover:scale-110 transition-transform">videocam</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface">Video</span>
                  <input type="file" accept="video/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { setVideoFile(file); setImageFile(null); }
                  }} />
                </label>
              </div>

              {mode === 'global' && (
                <div className="w-full pt-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 block mb-3">Discovery Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                          selectedCategory === cat 
                            ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                            : 'bg-white/5 text-on-surface-variant hover:bg-white/10'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && <p className="text-error text-xs font-bold bg-error/10 p-3 rounded-xl">{error}</p>}
            {uploadProgress && (
              <div className="flex items-center gap-3 text-primary animate-pulse">
                <span className="material-symbols-outlined text-sm">refresh</span>
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">{uploadProgress}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-6 border-t border-white/5">
              {onCancel && (
                <button 
                  type="button"
                  onClick={onCancel}
                  className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all"
                >
                  Discard Changes
                </button>
              )}
              <Button 
                type="submit" 
                disabled={loading || !title || !content}
                className="px-12 py-4 rounded-2xl shadow-xl shadow-primary/20"
              >
                {loading ? uploadProgress || 'Publishing...' : 'Publish Exhibit'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // Render logic for Inline Bar
  return (
    <div className={`bg-surface-container-lowest rounded-[2rem] border border-outline-variant/10 overflow-hidden transition-all duration-500 ease-out mb-8 ${collapsed ? 'p-4' : 'p-8'} ambient-shadow`}>
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
          <div className="flex-1 bg-surface-container-high/50 rounded-full px-6 py-2.5 text-on-surface-variant/60 text-sm font-medium group-hover:bg-surface-container-high transition-colors">
            {mode === 'global' ? 'Share a discovery with the world...' : `Exhibit something in ${communityName}...`}
          </div>
          <button className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center ambient-shadow active:scale-95 transition-all">
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
                className={`relative rounded-2xl border-2 border-dashed border-outline-variant/30 aspect-video flex flex-col items-center justify-center gap-2 overflow-hidden group hover:border-primary/40 transition-colors cursor-pointer ${imageFile ? 'border-primary/40' : ''}`}
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
                className={`relative rounded-2xl border-2 border-dashed border-outline-variant/30 aspect-video flex flex-col items-center justify-center gap-2 overflow-hidden group hover:border-secondary/40 transition-colors cursor-pointer ${videoFile ? 'border-secondary/40' : ''}`}
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

            {mode === 'global' && (
              <div className="pt-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 block mb-3">Discovery Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                        selectedCategory === cat 
                          ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                          : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-error text-xs font-bold bg-error/10 p-3 rounded-xl">{error}</p>}
          {uploadProgress && (
            <div className="flex items-center gap-3 text-primary animate-pulse">
              <span className="material-symbols-outlined text-sm">refresh</span>
              <p className="text-[10px] font-black uppercase tracking-widest leading-none">{uploadProgress}</p>
            </div>
          )}

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

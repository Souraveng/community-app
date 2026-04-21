'use client';

import React, { useState, useRef } from 'react';
import Navbar from '../../../components/layout/Navbar';
import Sidebar from '../../../components/layout/Sidebar';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { useCommunity } from '../../../hooks/useCommunity';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '../../../lib/supabase';
import { uploadFile } from '../../../lib/storage';
import { useAuth } from '../../../hooks/useAuth';

export default function CreateCommunityPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { createCommunity } = useCommunity();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState<'avatar' | 'banner' | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(type);
    try {
      const bucket = 'avatars';
      const path = `communities/${type}s/${user.uid}_${Date.now()}_${file.name}`;
      
      const publicUrl = await uploadFile(bucket, path, file, { 
        maxSizeMB: type === 'avatar' ? 1 : 5,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });

      if (type === 'avatar') setAvatarUrl(publicUrl);
      else setBannerUrl(publicUrl);

    } catch (err: any) {
      setError(`Failed to upload ${type}: ${err.message}`);
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.includes(' ')) {
      setError('Gallery name cannot contain spaces. Use hyphens instead.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createCommunity({
        name: name.toLowerCase(),
        description,
        avatar_url: avatarUrl || undefined,
        banner_url: bannerUrl || undefined
      });
      router.push(`/community/${name.toLowerCase()}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create gallery. It might already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar mb-visible={false} />
        
        <main className="flex-1 ml-0 lg:ml-64 p-4 md:p-12 relative">
          {/* Animated Background Blob */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] rounded-full -z-10 animate-pulse"></div>
          
          <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-12">
            
            {/* Form Section */}
            <div className="space-y-8">
              <div className="mb-8">
                <h1 className="text-4xl md:text-5xl font-black font-headlines tracking-tighter mb-4 text-on-surface">
                  Create Gallery
                </h1>
                <p className="text-on-surface-variant font-body text-lg leading-relaxed opacity-80">
                  Establish a new space for creative discourse. Galleries are curated environments for sharing specific aesthetic movements and design disciplines.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 bg-surface-container-low/20 backdrop-blur-xl p-8 md:p-10 rounded-[3rem] border border-outline-variant/10 ambient-shadow">
                <div className="space-y-6">
                  <div>
                    <Input 
                      label="Gallery Name" 
                      placeholder="e.g. brutalism, neo-tokyo, synthwave" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="bg-surface-container-lowest border-outline-variant/20 focus:border-primary/50"
                    />
                    <div className="flex items-center gap-2 mt-3 ml-1">
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest opacity-60">
                        Handle: g/{name.toLowerCase() || 'unnamed'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1 opacity-60">Curatorial Vision</label>
                    <textarea 
                      className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-primary/20 focus:border-primary/50 min-h-[120px] font-body text-on-surface transition-all outline-none" 
                      placeholder="Describe the aesthetic requirements and purpose of this gallery..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  {/* Media Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      onClick={() => avatarInputRef.current?.click()}
                      className="group cursor-pointer aspect-square rounded-3xl border-2 border-dashed border-outline-variant/20 hover:border-primary/40 transition-all flex flex-col items-center justify-center gap-3 bg-surface-container-lowest/30 relative overflow-hidden"
                    >
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt="Avatar" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-3xl opacity-20 group-hover:opacity-100 group-hover:text-primary transition-all">add_photo_alternate</span>
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100">Add Icon</span>
                        </>
                      )}
                      {uploading === 'avatar' && <div className="absolute inset-0 bg-background/60 flex items-center justify-center"><span className="material-symbols-outlined animate-spin">refresh</span></div>}
                    </div>

                    <div 
                      onClick={() => bannerInputRef.current?.click()}
                      className="group cursor-pointer aspect-square rounded-3xl border-2 border-dashed border-outline-variant/20 hover:border-primary/40 transition-all flex flex-col items-center justify-center gap-3 bg-surface-container-lowest/30 relative overflow-hidden"
                    >
                      {bannerUrl ? (
                        <Image src={bannerUrl} alt="Banner" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-3xl opacity-20 group-hover:opacity-100 group-hover:text-primary transition-all">landscape</span>
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100">Add Cover</span>
                        </>
                      )}
                      {uploading === 'banner' && <div className="absolute inset-0 bg-background/60 flex items-center justify-center"><span className="material-symbols-outlined animate-spin">refresh</span></div>}
                    </div>
                  </div>

                  <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} />
                  <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'banner')} />
                </div>

                {error && (
                  <div className="p-4 rounded-2xl bg-error-container/20 text-error border border-error/10 text-xs font-bold flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg">dangerous</span>
                    {error}
                  </div>
                )}

                 <div className="flex items-center justify-between pt-6">
                  <button type="button" onClick={() => router.back()} className="text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors">Cancel</button>
                  <Button variant="primary" type="submit" disabled={loading} className="px-10 py-4 text-xs font-black">
                    {loading ? 'Curating...' : 'Initialize Gallery'}
                  </Button>
                </div>
              </form>
            </div>

            {/* Preview Section */}
            <div className="hidden xl:block sticky top-24 h-fit">
              <div className="mb-6 ml-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40">Preview</span>
              </div>
              
              <div className="relative group overflow-hidden h-[500px] rounded-[4rem] border border-outline-variant/10 bg-surface-container-lowest ambient-shadow transition-all duration-500 hover:shadow-primary/5">
                {/* Simulated Header */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 z-10" />
                
                {/* Banner Preview */}
                <div className="absolute inset-0 bg-surface-container-high transition-transform duration-700 group-hover:scale-105">
                  {bannerUrl ? (
                    <Image src={bannerUrl} alt="Banner Preview" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-surface-container-highest/50 to-surface-container-low/50" />
                  )}
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 z-20 p-12 flex flex-col justify-end">
                  <div className="flex items-end gap-6 mb-8 transform transition-all duration-500 group-hover:translate-x-2">
                    <div className="w-24 h-24 rounded-3xl bg-surface-container-lowest/20 backdrop-blur-md p-1 border border-white/10 shadow-2xl overflow-hidden relative">
                       {avatarUrl ? (
                         <Image src={avatarUrl} alt="Avatar Preview" fill className="object-cover" />
                       ) : (
                         <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                           <span className="material-symbols-outlined text-white/40 text-4xl">architecture</span>
                         </div>
                       )}
                    </div>
                    <div className="pb-2">
                      <h3 className="text-4xl font-black font-headlines text-white tracking-tighter leading-none mb-2">g/{name || 'identity'}</h3>
                      <p className="text-white/60 font-bold text-[10px] uppercase tracking-[0.2em]">0 Curators • Active Now</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 opacity-80 max-w-sm">
                    <div className="h-px bg-white/10 w-full mb-6"></div>
                    <p className="text-white/80 font-body text-sm leading-relaxed italic line-clamp-3">
                      "{description || 'Awaiting curatorial vision for this new gallery...'}"
                    </p>
                    <div className="flex gap-2">
                      {[1,2,3].map(i => <div key={i} className="h-1 w-8 rounded-full bg-white/10"></div>)}
                    </div>
                  </div>
                </div>

                 {/* Status removed */}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import Button from '../../components/common/Button';
import { useProfile } from '../../hooks/useProfile';

export default function SettingsPage() {
  const { profile, updateProfile, loading } = useProfile();

  const toggleAutoplay = async () => {
    if (!profile) return;
    try {
      await updateProfile({ autoplay_enabled: !profile.autoplay_enabled });
    } catch (err) {
      console.error('Error updating autoplay setting:', err);
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center font-headlines text-2xl"><Navbar />Calibrating Interface...</div>;

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Navbar />
      
      <div className="flex pt-16">
        <Sidebar />
        
        <main className="flex-1 lg:ml-64 p-8 max-w-4xl mx-auto">
          <header className="mb-12">
            <h1 className="text-4xl font-extrabold tracking-tight font-headlines text-on-surface mb-2">Interface Control</h1>
            <p className="text-on-surface-variant font-body">Tailor your curatorial experience and network preferences.</p>
          </header>

          <div className="space-y-8">
            {/* Section: Experience */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-6 border-b border-outline-variant/10 pb-4">Experience Settings</h2>
              
              <div className="bg-surface-container-low/30 rounded-[2rem] p-8 border border-outline-variant/5 ambient-shadow flex items-center justify-between group hover:border-outline-variant/20 transition-all">
                <div className="flex gap-6 items-center">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">play_circle</span>
                  </div>
                  <div>
                    <h3 className="font-headlines font-bold text-lg mb-1">Video Autoplay</h3>
                    <p className="text-sm font-body text-on-surface-variant opacity-70">Automatically play exhibit videos as you scroll the feed.</p>
                  </div>
                </div>
                
                <button 
                  onClick={toggleAutoplay}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${profile?.autoplay_enabled ? 'bg-primary' : 'bg-surface-container-highest'}`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${profile?.autoplay_enabled ? 'translate-x-7' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </section>

            {/* Section: Privacy */}
            <section>
               <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-6 border-b border-outline-variant/10 pb-4">Curatorial & Network</h2>
               
               <div className="space-y-4">
                  <div className="bg-surface-container-low/30 rounded-[2rem] p-8 border border-outline-variant/5 flex items-center justify-between opacity-50 cursor-not-allowed">
                    <div className="flex gap-6 items-center">
                      <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined">shield</span>
                      </div>
                      <div>
                        <h3 className="font-headlines font-bold text-lg mb-1">Private Gallery</h3>
                        <p className="text-sm font-body text-on-surface-variant">Only approved followers can view your collection.</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-surface-container-highest px-3 py-1 rounded-full">Coming Soon</span>
                  </div>
               </div>
            </section>

            <div className="pt-12 text-center">
               <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-30 mb-4 text-primary">Atelier OS v2.4.0</p>
               <Button variant="ghost" className="text-error hover:bg-error/5" onClick={() => window.location.href='/logout'}>Close Atelier</Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

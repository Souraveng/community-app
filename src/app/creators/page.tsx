'use client';

import React from 'react';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import Image from 'next/image';
import Link from 'next/link';

const creators = [
  {
    name: 'Dieter Rams',
    handle: 'dieter_rams',
    role: 'Industrial Legend',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    exhibits: '1.2k',
    followers: '450k',
    bio: 'Ten principles for good design. Less but better.'
  },
  {
    name: 'Zaha Hadid',
    handle: 'zaha_arch',
    role: 'Deconstructivist',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    exhibits: '840',
    followers: '2.1M',
    bio: 'Pushing the boundaries of curvature and geometry.'
  },
  {
    name: 'Jony Ive',
    handle: 'jony_lines',
    role: 'Hardware Guru',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    exhibits: '230',
    followers: '1.8M',
    bio: 'Focusing on the materials and the details that matter.'
  }
];

export default function CreatorsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64 p-8">
          <header className="mb-12 max-w-4xl">
            <h1 className="text-4xl font-black font-headlines tracking-tighter mb-4">Master Curators</h1>
            <p className="text-on-surface-variant font-body text-lg max-w-2xl">
              Connect with the visionaries defining the next era of aesthetics. From industrial designers to digital architects.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {creators.map((creator) => (
              <Link key={creator.handle} href={`/profile/${creator.handle}`} className="group bg-surface-container-low/50 p-8 rounded-[2.5rem] border border-outline-variant/10 flex items-start gap-8 hover:bg-surface-container-low transition-all">
                <div className="w-24 h-24 rounded-full overflow-hidden relative border-4 border-white shadow-xl flex-shrink-0 group-hover:scale-105 transition-transform">
                   <Image 
                    src={creator.avatar} 
                    alt={creator.name} 
                    fill 
                    className="object-cover" 
                    sizes="96px"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h2 className="text-xl font-black font-headlines text-on-surface tracking-tight">{creator.name}</h2>
                      <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-3">{creator.role}</p>
                    </div>
                    <button className="px-5 py-2 bg-on-surface text-surface rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                      Follow
                    </button>
                  </div>
                  <p className="text-sm text-on-surface-variant line-clamp-2 italic mb-6 font-body">
                    "{creator.bio}"
                  </p>
                  <div className="flex items-center gap-8 pt-4 border-t border-outline-variant/10">
                    <div>
                      <p className="text-lg font-black font-headlines">{creator.exhibits}</p>
                      <p className="text-[10px] uppercase tracking-tighter text-on-surface-variant/60 font-bold">Exhibits</p>
                    </div>
                    <div>
                      <p className="text-lg font-black font-headlines">{creator.followers}</p>
                      <p className="text-[10px] uppercase tracking-tighter text-on-surface-variant/60 font-bold">Collectors</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import PostCard from '../../components/common/PostCard';

const exploreItems = [
  {
    id: 'exp-1',
    user: 'visual_story',
    timestamp: '2h ago',
    community: 'Architecture',
    title: 'The Brutalist Revival in Eastern Europe',
    content: 'Exploring the intersection of concrete and sunlight in modern Kyiv. A deep dive into sculptural forms that define neighborhoods.',
    image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=2000',
    upvotes: '3.2k',
    comments: '45',
  },
  {
    id: 'exp-2',
    user: 'minimal_type',
    timestamp: '5h ago',
    community: 'UI/UX',
    title: 'Why Kerning is the soul of UX',
    content: 'A layout is only as strong as its white space. Let\'s look at how Swiss typography influences modern SaaS dashboards.',
    image: 'https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?auto=format&fit=crop&q=80&w=2000',
    upvotes: '1.1k',
    comments: '89',
  },
  {
    id: 'exp-3',
    user: 'light_catcher',
    timestamp: '1d ago',
    community: 'Photography',
    title: 'Golden Hour in the High Sierras',
    content: 'Caught this frame just as the sun dipped behind the ridge. The dynamic range of the new sensor is incredible.',
    image: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=2000',
    upvotes: '5.6k',
    comments: '210',
  }
];

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64 p-8">
          <header className="mb-12 max-w-4xl">
            <h1 className="text-4xl font-black font-headlines tracking-tighter mb-4">Discovery Feed</h1>
            <p className="text-on-surface-variant font-body text-lg max-w-2xl">
              Hand-picked creative exhibitions from across the global community. Curated by humans, powered by taste.
            </p>
          </header>

          <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-4 scrollbar-hide">
             {['All', 'Trending', 'Curated', 'Architecture', 'UI/UX', 'Photography', 'Interior'].map(tag => (
               <button key={tag} className="px-6 py-2 rounded-full border border-outline-variant/10 hover:border-primary/40 hover:bg-primary/5 transition-all text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                 {tag}
               </button>
             ))}
          </div>

          <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
            {exploreItems.map((item) => (
              <div key={item.id} className="break-inside-avoid">
                <PostCard {...item} />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

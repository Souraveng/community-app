'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import PostCard from '@/components/common/PostCard';
import { usePosts } from '@/hooks/usePosts';
import { useProfile } from '@/hooks/useProfile';

export default function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState<'latest' | 'trending'>('trending');
  
  const { posts, loading } = usePosts(
    selectedCategory === 'All' ? undefined : selectedCategory,
    sortOrder
  );
  const { profile } = useProfile();

  const categories = ['All', 'Trending', 'Architecture', 'UI/UX', 'Photography', 'Interior', 'Curated'];

  const handleCategoryClick = (category: string) => {
    if (category === 'Trending') {
      setSortOrder('trending');
      setSelectedCategory('All');
    } else {
      setSortOrder('latest');
      setSelectedCategory(category);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
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
             {categories.map(tag => (
               <button 
                 key={tag} 
                 onClick={() => handleCategoryClick(tag)}
                 className={`px-6 py-2 rounded-full border transition-all text-xs font-bold uppercase tracking-widest whitespace-nowrap ${
                   (tag === 'Trending' && sortOrder === 'trending') || (selectedCategory === tag && sortOrder === 'latest')
                     ? 'bg-primary text-on-primary border-transparent shadow-lg shadow-primary/20'
                     : 'border-outline-variant/10 hover:border-primary/40 hover:bg-primary/5'
                 }`}
               >
                 {tag}
               </button>
             ))}
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {posts.length > 0 ? (
                <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
                  {posts.map((post) => (
                    <div key={post.id} className="break-inside-avoid">
                      <PostCard 
                        id={post.id}
                        userId={post.user_id}
                        user={post.username}
                        timestamp={formatDate(post.created_at)}
                        community={post.community_name}
                        title={post.title}
                        content={post.content}
                        image={post.image_url || 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=800'}
                        upvotes={post.upvotes.toString()}
                        comments={post.comment_count.toString()}
                        autoplay={profile?.autoplay_enabled ?? true}
                        onDelete={() => { /* Handled by hook state in usePosts but good for callback compatibility */ }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-surface-container-low/30 rounded-[3rem] border border-dashed border-outline-variant/20">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 mb-4">landscape</span>
                  <p className="text-sm font-bold text-on-surface-variant/40 uppercase tracking-widest">No exhibitions found in this gallery</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

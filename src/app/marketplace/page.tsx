'use client';

import React, { useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import { useMarketplace } from '../../hooks/useMarketplace';
import MarketListingCard from '../../components/marketplace/MarketListingCard';
import MarketListingForm from '../../components/marketplace/MarketListingForm';
import Button from '../../components/common/Button';

export default function MarketplacePage() {
  const { listings, loading, refresh } = useMarketplace();
  const [showPostForm, setShowPostForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'sold'>('open');

  const filteredListings = listings.filter(l => {
    if (filter === 'all') return true;
    return l.status === filter;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex pt-16">
        <Sidebar />
        
        <main className="flex-1 ml-0 md:ml-64 p-8">
          <div className="max-w-6xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
              <div>
                <h1 className="text-5xl font-black font-headlines tracking-tighter text-on-surface mb-2">The Exchange</h1>
                <p className="text-on-surface-variant font-body text-lg max-w-2xl">
                  A high-fidelity marketplace for premium digital artifacts. Discover, bid, and curate your private collection.
                </p>
              </div>
              <Button 
                variant="primary" 
                className="px-8 py-4 rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-3"
                onClick={() => setShowPostForm(!showPostForm)}
              >
                <span className="material-symbols-outlined">{showPostForm ? 'close' : 'add_circle'}</span>
                {showPostForm ? 'Close Form' : 'Post Exhibit'}
              </Button>
            </header>

            {showPostForm && (
              <div className="mb-16 animate-in slide-in-from-top-4 duration-500">
                <MarketListingForm onSuccess={() => {
                  setShowPostForm(false);
                  refresh();
                }} />
              </div>
            )}

            <div className="space-y-8">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-outline-variant/10">
                <button 
                  onClick={() => setFilter('open')}
                  className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${filter === 'open' ? 'bg-primary text-on-primary shadow-lg shadow-primary/10' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'}`}
                >
                  Live Auctions
                </button>
                <button 
                  onClick={() => setFilter('sold')}
                  className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${filter === 'sold' ? 'bg-primary text-on-primary shadow-lg shadow-primary/10' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'}`}
                >
                  Sold
                </button>
                <button 
                  onClick={() => setFilter('all')}
                  className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-primary text-on-primary shadow-lg shadow-primary/10' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'}`}
                >
                  History
                </button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-[3/4] rounded-[2.5rem] bg-surface-container-low animate-pulse" />
                  ))}
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="py-32 text-center bg-surface-container-low/20 rounded-[3rem] border border-dashed border-outline-variant/20">
                  <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4 opacity-30">garden_cart</span>
                  <p className="text-on-surface-variant font-headlines font-bold uppercase tracking-[0.2em] text-xs">No artifacts matching your filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                  {filteredListings.map((listing) => (
                    <MarketListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { useBids } from '../../hooks/useBids';
import { supabase } from '../../lib/supabase';
import Button from '../common/Button';
import ImageModal from '../common/ImageModal';
import { formatDistanceToNow } from 'date-fns';

interface MarketListingCardProps {
  listing: any;
  isOwner?: boolean;
  onAcceptBid?: (bid: any) => void;
  onDelete?: (listingId: string) => void;
}

const MarketListingCard: React.FC<MarketListingCardProps> = ({ listing, isOwner, onAcceptBid, onDelete }) => {
  const { user } = useAuth();
  const { bids, placeBid, acceptBid, loading: bidsLoading } = useBids(listing.id);
  const [bidAmount, setBidAmount] = useState<number>(listing.current_highest_bid + 1);
  const [showBids, setShowBids] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCommentCount() {
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('listing_id', listing.id);
      setCommentCount(count || 0);
    }
    fetchCommentCount();
  }, [listing.id]);

  const currencySymbol = listing.currency === 'INR' ? '₹' : '$';

  const handlePlaceBid = async () => {
    if (!user) return;
    
    // MAX BID LIMIT: 10,000,000
    if (bidAmount > 10000000) {
      setError('Curation Limit: 10,000,000 max.');
      return;
    }

    setError(null);
    try {
      await placeBid(bidAmount);
      setBidAmount(prev => prev + 1);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this listing? This action is permanent.')) return;
    if (onDelete) onDelete(listing.id);
  };

  const handleAccept = async (bid: any) => {
    if (onAcceptBid) onAcceptBid(bid);
    else await acceptBid(bid);
  };

  const isExpired = listing.expires_at ? new Date(listing.expires_at) < new Date() : false;
  const statusLabel = listing.status === 'sold' ? 'Sold' : (isExpired || listing.status === 'closed' ? 'Closed' : 'Active');

  return (
    <div className="bg-surface-container-low/30 rounded-[2.5rem] overflow-hidden border border-outline-variant/10 hover:ambient-shadow transition-all duration-500 group">
      <div 
        className="aspect-square relative overflow-hidden cursor-zoom-in"
        onClick={() => listing.image_url && setShowImageModal(true)}
      >
        {listing.image_url ? (
          <Image src={listing.image_url} alt={listing.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant font-headlines font-black text-2xl">
            {listing.title[0].toUpperCase()}
          </div>
        )}
        <div className="absolute top-4 right-4 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest border border-white/10">
          {statusLabel}
        </div>
        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-white text-4xl scale-50 group-hover:scale-100 transition-transform duration-500">zoom_in</span>
            <span className="text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">Click to Zoom</span>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-3">
              <Link href={`/marketplace/${listing.id}`} className="flex-1">
                <h3 className="text-2xl font-black font-headlines tracking-tighter text-on-surface hover:text-primary transition-colors mb-1 truncate">{listing.title}</h3>
              </Link>
              {isOwner && onDelete && (
                <button 
                  onClick={handleDelete}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                  title="Delete Listing"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              )}
            </div>
            <p className="text-[10px] font-bold text-primary font-headlines uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">person</span> u/{listing.seller_name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40 mb-1">Highest Bid</p>
            <p className="text-2xl font-black text-on-surface font-headlines leading-none">
              {currencySymbol}{listing.current_highest_bid.toLocaleString()}
            </p>
          </div>
        </div>

        <p className="text-sm text-on-surface-variant/80 mb-6 font-body line-clamp-2">{listing.description}</p>

        <div className="flex items-center gap-6 mb-8 border-t border-outline-variant/10 pt-6">
          <Link href={`/marketplace/${listing.id}`} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-all group/stat">
            <span className="material-symbols-outlined text-sm flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-high group-hover/stat:bg-primary/10">mode_comment</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">{commentCount} Comments</span>
              <span className="text-[8px] font-bold text-on-surface-variant/40 uppercase tracking-widest">See Interest</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-high">payments</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">{bids.length} Bids</span>
              <span className="text-[8px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Active Activity</span>
            </div>
          </div>
        </div>

        {listing.status === 'open' && !isExpired && (
          <div className="space-y-4">
            {!isOwner ? (
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface font-black opacity-40">{currencySymbol}</span>
                  <input 
                    type="number" 
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/10 focus:outline-none focus:border-primary text-sm font-bold bg-surface-container-high/50"
                  />
                </div>
                <Button variant="primary" className="px-8" onClick={handlePlaceBid}>Bid Now</Button>
              </div>
            ) : (
              <Button variant="primary" className="w-full py-4 rounded-2xl" onClick={() => setShowBids(!showBids)}>
                {showBids ? 'Hide Bids' : 'View & Accept Bids'}
              </Button>
            )}
            {error && <p className="text-[10px] text-error font-bold uppercase tracking-widest">{error}</p>}
          </div>
        )}

        {showBids && (
          <div className="mt-8 pt-8 border-t border-outline-variant/10 space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">list</span> Current Bids
            </h4>
            <div className="max-h-60 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {bidsLoading ? (
                <div className="text-center py-4 text-[10px] font-bold opacity-40 uppercase tracking-widest animate-pulse">Syncing Bids...</div>
              ) : bids.length === 0 ? (
                <div className="text-center py-4 text-[10px] font-bold opacity-40 uppercase tracking-widest">No bids yet</div>
              ) : (
                bids.map((bid) => (
                  <div key={bid.id} className="flex justify-between items-center p-4 bg-surface-container-low rounded-xl border border-outline-variant/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden relative">
                        {bid.bidder_avatar && <Image src={bid.bidder_avatar} alt={bid.bidder_name || ''} fill className="object-cover" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface">u/{bid.bidder_name}</p>
                        <p className="text-[10px] text-on-surface-variant opacity-40">{formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm font-black text-on-surface">{currencySymbol}{bid.amount.toLocaleString()}</p>
                      {isOwner && (
                        <button 
                          onClick={() => handleAccept(bid)}
                          className="px-4 py-2 bg-on-surface text-surface rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                        >
                          Accept
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {showImageModal && listing.image_url && (
        <ImageModal 
          imageUrl={listing.image_url} 
          title={listing.title} 
          onClose={() => setShowImageModal(false)} 
        />
      )}
    </div>
  );
};

export default MarketListingCard;

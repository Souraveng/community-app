'use client';

import React, { useState } from 'react';
import Navbar from '../../../components/layout/Navbar';
import Sidebar from '../../../components/layout/Sidebar';
import Image from 'next/image';
import Button from '../../../components/common/Button';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { useListing } from '../../../hooks/useMarketplace';
import { useBids } from '../../../hooks/useBids';
import { useComments } from '../../../hooks/useComments';
import CommentItem from '../../../components/common/CommentItem';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function MarketplaceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const { listing, loading: listingLoading } = useListing(id as string);
  const { bids, placeBid, loading: bidsLoading } = useBids(id as string);
  const { comments, loading: commentsLoading, addComment } = useComments(undefined, id as string);
  
  const [bidAmount, setBidAmount] = useState<string>('');
  const [newComment, setNewComment] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlaceBid = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= (listing?.current_highest_bid || 0)) {
      setError(`Bid must be higher than ${listing?.currency === 'INR' ? '₹' : '$'}${listing?.current_highest_bid}`);
      return;
    }

    setSubmittingBid(true);
    setError(null);
    try {
      await placeBid(amount);
      setBidAmount('');
    } catch (err: any) {
      setError(err.message || 'Failed to place bid');
    } finally {
      setSubmittingBid(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setPostingComment(true);
    const success = await addComment(newComment);
    if (success) {
      setNewComment('');
    }
    setPostingComment(false);
  };

  if (listingLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Navbar /><span className="material-symbols-outlined animate-spin text-4xl text-primary">analytics</span></div>;
  if (!listing) return <div className="min-h-screen bg-background flex items-center justify-center font-headlines text-2xl"><Navbar />Art listing not found.</div>;

  const currencySymbol = listing.currency === 'INR' ? '₹' : '$';

  return (
    <div className="min-h-screen bg-background text-on-surface select-none">
      <Navbar />
      
      <div className="flex pt-16">
        <Sidebar mb-visible={false} />
        
        <main className="flex-1 ml-0 lg:ml-64 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {/* Breadcrumbs */}
          <Link href="/marketplace" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 hover:text-primary transition-all mb-8">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Marketplace
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
            {/* Left Column: Image & Description */}
            <div className="lg:col-span-7 space-y-8">
              <div className="relative aspect-square group/main border border-outline-variant/10 rounded-[3rem] overflow-hidden bg-surface-container-highest shadow-2xl">
                {listing.image_url ? (
                  <Image src={listing.image_url} alt={listing.title} fill className="object-contain p-4" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-headlines font-black">{listing.title[0]}</div>
                )}
              </div>
              
              <div className="p-8 bg-surface-container-low/20 rounded-[2.5rem] border border-outline-variant/10">
                <h3 className="font-headlines font-black text-xs uppercase tracking-widest text-on-surface-variant/60 mb-4">Technical Description</h3>
                <p className="font-body text-on-surface/80 leading-relaxed text-lg">{listing.description}</p>
              </div>
            </div>

            {/* Right Column: Bidding & Stats */}
            <div className="lg:col-span-5 space-y-8">
              <div className="p-10 bg-surface-container-lowest rounded-[3rem] border border-outline-variant/10 shadow-2xl relative overflow-hidden">
                {/* Status Badge */}
                <div className="absolute top-8 right-8 px-4 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                  {listing.status}
                </div>

                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden relative border border-outline-variant/10 bg-surface-container-high">
                    {listing.seller_avatar ? (
                      <Image src={listing.seller_avatar} alt={listing.seller_name || ''} fill className="object-cover" />
                    ) : (
                      <span className="material-symbols-outlined flex items-center justify-center h-full opacity-20">person</span>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Listing by</p>
                    <p className="font-headlines font-black text-on-surface text-lg">u/{listing.seller_name}</p>
                  </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-black font-headlines tracking-tighter text-on-surface leading-none mb-4">
                  {listing.title}
                </h1>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant/10">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant/60 mb-1">Starting At</p>
                    <p className="text-xl font-bold font-headlines">{currencySymbol}{listing.starting_price}</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-secondary/5 border border-secondary/10">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-secondary/60 mb-1">Current Bid</p>
                    <p className="text-2xl font-black font-headlines text-secondary">{currencySymbol}{listing.current_highest_bid}</p>
                  </div>
                </div>

                {/* Bidding Interface */}
                {listing.status === 'open' && (
                  <div className="space-y-4">
                    <div className="flex gap-4 p-2 bg-background/50 rounded-full border border-outline-variant/20 focus-within:border-primary/40 transition-all">
                      <input 
                        type="number" 
                        placeholder={`Min ${currencySymbol}${listing.current_highest_bid + 1}`}
                        className="flex-1 bg-transparent border-none outline-none px-6 text-sm font-bold font-headlines"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                      />
                      <Button 
                        variant="primary" 
                        className="rounded-full px-8 py-3 text-[10px] font-black uppercase tracking-widest"
                        onClick={handlePlaceBid}
                        disabled={submittingBid || !bidAmount}
                      >
                        {submittingBid ? 'Transmitting...' : 'Place Bid'}
                      </Button>
                    </div>
                    {error && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest text-center">{error}</p>}
                  </div>
                )}

                {/* Timeline */}
                <div className="mt-10 pt-10 border-t border-outline-variant/10 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-1">Ends In</p>
                    <p className="text-sm font-bold font-headlines text-primary">
                      {listing.expires_at ? formatDistanceToNow(new Date(listing.expires_at)) : 'Ongoing'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-1">Total Bids</p>
                    <p className="text-sm font-bold font-headlines">{bids.length}</p>
                  </div>
                </div>
              </div>

              {/* Bid History List */}
              <div className="p-8 bg-surface-container-low/10 rounded-[2.5rem] border border-outline-variant/10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-headlines font-black text-xs uppercase tracking-widest text-on-surface tracking-widest">Active Bid History</h3>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                </div>
                
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 scrollbar-hide">
                  {bids.length === 0 ? (
                    <p className="text-center py-10 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/20">No bids placed encrypted</p>
                  ) : bids.map((bid) => (
                    <div key={bid.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-outline-variant/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden relative bg-surface-container-high">
                          {bid.bidder_avatar && <Image src={bid.bidder_avatar} alt={bid.bidder_name || ''} fill className="object-cover" />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface">u/{bid.bidder_name}</p>
                          <p className="text-[9px] font-bold text-on-surface-variant/40">{formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}</p>
                        </div>
                      </div>
                      <p className="font-headlines font-black text-secondary">{currencySymbol}{bid.amount}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-outline-variant/10 mb-16" />

          {/* Comments Section */}
          <section className="space-y-12 pb-32">
            <h3 className="font-headlines font-black text-2xl text-on-surface flex items-center gap-4">
              Discussion Collective
              <span className="text-on-surface-variant text-sm font-medium opacity-40">
                ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
              </span>
            </h3>

            {user ? (
              <div className="bg-surface-container-low/30 p-8 rounded-[3rem] border border-outline-variant/10">
                <textarea 
                  className="w-full bg-surface-container-lowest border-none rounded-[2rem] p-6 text-sm focus:ring-1 focus:ring-primary min-h-[140px] font-body text-on-surface placeholder:text-on-surface-variant/40 shadow-inner" 
                  placeholder="Analyze and provide feedback on this intelligence..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                ></textarea>
                <div className="flex justify-end mt-6">
                  <Button variant="primary" className="px-10 py-4 font-black uppercase tracking-[0.2em] text-xs" onClick={handlePostComment} disabled={postingComment || !newComment.trim()}>
                    {postingComment ? 'Transmitting...' : 'Dispatch Comment'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-surface-container-low/30 p-12 rounded-[3rem] text-center border border-dashed border-outline-variant/20">
                <p className="text-on-surface-variant font-bold mb-6">Authorization required to join the discussion.</p>
                <Button variant="secondary" onClick={() => router.push('/login')}>Authenticate to Access</Button>
              </div>
            )}

            <div className="space-y-8">
              {commentsLoading ? (
                <div className="flex justify-center py-20">
                  <span className="material-symbols-outlined animate-spin opacity-20 text-4xl">refresh</span>
                </div>
              ) : comments.map((comment) => (
                <CommentItem 
                  key={comment.id} 
                  comment={comment} 
                  onReply={addComment} 
                />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

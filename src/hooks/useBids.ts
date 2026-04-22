import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Bid {
  id: string;
  listing_id: string;
  bidder_id: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  bidder_name?: string;
  bidder_avatar?: string | null;
}

export function useBids(listingId?: string) {
  const { user } = useAuth();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (listingId) {
      fetchBids();

      const channelId = `bids_${listingId}_${Math.random().toString(36).substring(7)}`;
      const channel = supabase
        .channel(channelId)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'bids',
          filter: `listing_id=eq.${listingId}`
        }, () => {
          fetchBids();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [listingId]);

  const fetchBids = async () => {
    if (!listingId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bids')
        .select(`
          *,
          profiles:bidder_id (username, avatar_url)
        `)
        .eq('listing_id', listingId)
        .order('amount', { ascending: false });

      if (error) throw error;

      const processed = (data || []).map((b: any) => ({
        ...b,
        bidder_name: b.profiles?.username,
        bidder_avatar: b.profiles?.avatar_url
      }));

      setBids(processed);
    } catch (err) {
      console.error('Error fetching bids:', err);
    } finally {
      setLoading(false);
    }
  };

  const placeBid = async (amount: number) => {
    if (!user || !listingId) return null;

    try {
      // 1. Check if bid is higher than current highest
      const { data: listing } = await supabase
        .from('marketplace_listings')
        .select('current_highest_bid')
        .eq('id', listingId)
        .single();
      
      if (listing && amount <= listing.current_highest_bid) {
        throw new Error('Bid must be higher than the current highest bid.');
      }

      // 2. Insert bid
      const { data: newBid, error: bidError } = await supabase
        .from('bids')
        .insert({
          listing_id: listingId,
          bidder_id: user.uid,
          amount,
          status: 'pending'
        })
        .select()
        .single();

      if (bidError) throw bidError;

      // 3. Update listing with new highest bid
      await supabase
        .from('marketplace_listings')
        .update({ current_highest_bid: amount })
        .eq('id', listingId);

      return newBid;
    } catch (err: any) {
      console.error('Error placing bid:', err);
      throw err;
    }
  };

  const acceptBid = async (bid: Bid) => {
    if (!user) return;

    try {
      // 1. Update bid status
      const { error: bidError } = await supabase
        .from('bids')
        .update({ status: 'accepted' })
        .eq('id', bid.id);
      
      if (bidError) throw bidError;

      // 2. Mark other bids as rejected (optional, but cleaner)
      await supabase
        .from('bids')
        .update({ status: 'rejected' })
        .eq('listing_id', bid.listing_id)
        .neq('id', bid.id);

      // 3. Update listing status
      await supabase
        .from('marketplace_listings')
        .update({ status: 'sold' })
        .eq('id', bid.listing_id);

      // 4. Automated Chat creation
      // Get seller info
      const { data: listing } = await supabase
        .from('marketplace_listings')
        .select('title')
        .eq('id', bid.listing_id)
        .single();

      // Create conversation
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', [user.uid, bid.bidder_id])
        .maybeSingle();

      let convId = existing?.id;

      if (!convId) {
        const { data: newlyCreated } = await supabase
          .from('conversations')
          .insert({
            participants: [user.uid, bid.bidder_id],
            initiator_id: user.uid,
            status: 'accepted' // Auto-accept for transaction bridge
          })
          .select()
          .single();
        convId = newlyCreated?.id;
      }

      if (convId) {
        await supabase.from('messages').insert({
          conversation_id: convId,
          sender_id: user.uid,
          content: `Hey! I've accepted your bid for "${listing?.title}". Your bid was ${bid.amount}. Let's coordinate the payment and delivery!`
        });
      }

      return true;
    } catch (err) {
      console.error('Error accepting bid:', err);
      return false;
    }
  };

  return { bids, loading, placeBid, acceptBid, refresh: fetchBids };
}

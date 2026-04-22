import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface MarketplaceListing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  starting_price: number;
  current_highest_bid: number;
  currency: 'USD' | 'INR';
  image_url: string | null;
  status: 'open' | 'sold' | 'closed';
  expires_at: string | null;
  created_at: string;
  seller_name?: string;
  seller_avatar?: string | null;
}

export function useMarketplace() {
  const { user } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();

    const channelId = `marketplace_changes_${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'marketplace_listings' 
      }, () => {
        fetchListings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select(`
          *,
          profiles:user_id (username, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processed = (data || []).map((item: any) => ({
        ...item,
        seller_name: item.profiles?.username,
        seller_avatar: item.profiles?.avatar_url
      }));

      setListings(processed);
    } catch (err) {
      console.error('Error fetching marketplace listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const createListing = async (listing: Omit<MarketplaceListing, 'id' | 'user_id' | 'created_at' | 'current_highest_bid' | 'status'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .insert({
          ...listing,
          user_id: user.uid,
          current_highest_bid: listing.starting_price,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error creating listing:', err);
      return null;
    }
  };

  const deleteListing = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .delete()
        .eq('id', listingId);
      
      if (error) throw error;
      fetchListings();
      return true;
    } catch (err) {
      console.error('Error deleting listing:', err);
      return false;
    }
  };

  const markAsSold = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .update({ status: 'sold' })
        .eq('id', listingId);
      
      if (error) throw error;
      fetchListings();
      return true;
    } catch (err) {
      console.error('Error marking as sold:', err);
      return false;
    }
  };

  const closeListing = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .update({ status: 'closed' })
        .eq('id', listingId);
      
      if (error) throw error;
      fetchListings();
    } catch (err) {
      console.error('Error closing listing:', err);
    }
  };

  return { 
    listings, 
    loading, 
    createListing, 
    closeListing, 
    deleteListing, 
    markAsSold, 
    refresh: fetchListings 
  };
}

export function useListing(listingId?: string) {
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchListing = async () => {
    if (!listingId) return;
    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select(`
          *,
          profiles:user_id (username, avatar_url)
        `)
        .eq('id', listingId)
        .single();

      if (error) throw error;

      if (data) {
        setListing({
          ...data,
          seller_name: data.profiles?.username,
          seller_avatar: data.profiles?.avatar_url
        });
      }
    } catch (err) {
      console.error('Error fetching listing:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsSold = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .update({ status: 'sold' })
        .eq('id', listingId);
      
      if (error) throw error;
      fetchListing();
      return true;
    } catch (err) {
      console.error('Error marking as sold:', err);
      return false;
    }
  };

  useEffect(() => {
    if (listingId) {
      fetchListing();

      // Self-healing Realtime Logic
      const channelId = `listing_${listingId}_${Math.random().toString(36).substring(7)}`;
      const channel = supabase.channel(channelId);
      
      let retryCount = 0;
      const maxRetries = 2;
      let pollingTimer: NodeJS.Timeout | null = null;

      const startPolling = () => {
        if (pollingTimer) return;
        pollingTimer = setInterval(fetchListing, 5000);
      };

      const subscribe = () => {
        channel
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'marketplace_listings',
            // BROAD LISTENING: Filter in JS to bypass Postgres syntax errors
            // filter: `id=eq.${listingId}`
          }, (payload: any) => {
            if (payload.new?.id === listingId || payload.old?.id === listingId) {
              fetchListing();
            }
          })
          .subscribe((status: string) => {
            if (status === 'CHANNEL_ERROR') {
              if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(subscribe, 2000);
              } else {
                startPolling();
              }
            } else if (status === 'SUBSCRIBED') {
              retryCount = 0;
            }
          });
      };

      subscribe();

      return () => {
        supabase.removeChannel(channel);
        if (pollingTimer) clearInterval(pollingTimer);
      };
    }
  }, [listingId]);

  return { listing, loading, markAsSold, refresh: fetchListing };
}

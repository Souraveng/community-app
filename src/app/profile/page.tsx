'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import Navbar from '../../components/layout/Navbar';

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, loading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile) {
      router.replace(`/profile/${profile.username}`);
    }
  }, [profile, loading, router]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center font-headlines text-2xl">
      <Navbar />
      Locating Curator...
    </div>
  );

  if (!user || !profile) return (
    <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-4">
      <Navbar />
      <p className="font-headlines text-2xl text-on-surface">Access Denied.</p>
      <button 
        onClick={() => router.push('/login')}
        className="px-8 py-3 bg-primary text-on-primary rounded-full font-bold uppercase tracking-widest"
      >
        Sign In
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center font-headlines text-2xl">
       <Navbar />
       Redirecting to Network...
    </div>
  );
}

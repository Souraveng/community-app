'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { supabase } from '../../lib/supabase';

export default function SignupPage() {
  const { user, loginWithGoogle, signUpWithEmail } = useAuth();
  const { updateProfile } = useProfile();
  const router = useRouter();
  const [isMounted, setIsMounted] = React.useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  useEffect(() => {
    const checkUsername = async () => {
      if (username.length < 3) {
        setUsernameAvailable(null);
        return;
      }
      setCheckingUsername(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username.toLowerCase())
          .single();
        
        if (error && error.code === 'PGRST116') {
          setUsernameAvailable(true);
        } else {
          setUsernameAvailable(false);
        }
      } catch (err) {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    };

    const timer = setTimeout(checkUsername, 500);
    return () => clearTimeout(timer);
  }, [username]);

  useEffect(() => {
    if (isMounted && user) {
      router.push('/home');
    }
  }, [user, router, isMounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signUpWithEmail(email, password);
      // Wait a moment for the profile creation trigger in useProfile to potentially start
      // or just call updateProfile which handles the profile record.
      // We'll update the profile with the extra metadata
      await updateProfile({
        full_name: displayName,
        username: username,
        age: parseInt(age) || null,
      });
      
      router.push('/home');
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden font-body">
      {/* Left Panel: Visual Experience */}
      <div className="hidden md:flex md:w-1/2 lg:w-[60%] bg-zinc-900 relative overflow-hidden group">
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-black/60 via-black/20 to-transparent"></div>
        
        {/* Animated Background Image */}
        <div className="absolute inset-0 scale-110 group-hover:scale-100 transition-transform duration-[10s] ease-out">
          <Image 
            src="https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=2000"
            alt="The Gallery Experience"
            fill
            className="object-cover opacity-70"
            sizes="50vw"
          />
        </div>

        {/* Floating Content */}
        <div className="relative z-20 self-center p-20 max-w-2xl">
          <Link href="/" className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white mb-12 hover:bg-white/20 transition-all group">
            <span className="material-symbols-outlined text-sm transition-transform group-hover:-translate-x-1">arrow_back</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Gallery</span>
          </Link>
          
          <h1 className="text-6xl lg:text-8xl font-black font-headlines text-white leading-[0.9] tracking-tighter mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            Start Your <br /> 
            <span className="text-primary-container italic">Legacy.</span>
          </h1>
          
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
            <p className="text-white/60 text-lg lg:text-xl font-medium leading-relaxed max-w-lg">
              Join 50,000+ curators who have escaped the algorithm. Build your own collection of inspiration.
            </p>
            
            <div className="flex gap-12 pt-8">
              <div>
                <p className="text-3xl font-black text-white font-headlines tracking-tight">1.2M+</p>
                <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">Exhibits Shared</p>
              </div>
              <div>
                <p className="text-3xl font-black text-white font-headlines tracking-tight">850</p>
                <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">Active Galleries</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Badge */}
        <div className="absolute bottom-12 left-20 z-20 flex items-center gap-4 animate-in fade-in slide-in-from-left-8 duration-700 delay-500">
          <div className="flex -space-x-4">
             {[1,2,3,4].map(i => (
               <div key={i} className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center overflow-hidden">
                 <span className="material-symbols-outlined text-zinc-600 text-sm">person</span>
               </div>
             ))}
          </div>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Joined by leading curators this week</p>
        </div>
      </div>

      {/* Right Panel: Signup Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 md:p-12 lg:p-20 relative bg-surface-container-lowest">
        {/* Mobile Back Button */}
        <div className="md:hidden absolute top-8 left-8">
          <Link href="/" className="p-3 rounded-full bg-surface-container-low text-on-surface">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
        </div>

        <div className="w-full max-w-md space-y-10">
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-headlines font-black tracking-tighter text-on-surface mb-3">Create Canvas</h2>
            <p className="text-on-surface-variant text-sm font-medium">Join the community dedicated to high-end curation.</p>
          </div>

          <div className="space-y-6">
            <button 
              onClick={loginWithGoogle}
              className="flex items-center justify-center gap-3 py-4 px-4 w-full rounded-full bg-white hover:bg-surface-container-low transition-all text-xs font-bold text-on-surface ring-1 ring-outline-variant uppercase tracking-widest active:scale-95 shadow-sm"
            >
              <img 
                alt="Google" 
                className="w-5 h-5" 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              />
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-outline-variant/10"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40">Or register with email</span>
              <div className="flex-grow border-t border-outline-variant/10"></div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-error-container text-on-error-container text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input 
                label="Public Full Name"
                placeholder="Dieter Rams"
                icon="person"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />

              <div className="relative">
                <Input 
                  label="Unique Username"
                  placeholder="dieter_rams"
                  icon="alternate_email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s+/g, '').toLowerCase())}
                  required
                />
                <div className="absolute right-4 top-10 flex items-center h-10">
                  {checkingUsername ? (
                    <span className="material-symbols-outlined animate-spin text-[14px] opacity-20">refresh</span>
                  ) : usernameAvailable === true ? (
                    <span className="material-symbols-outlined text-primary text-[14px]">check_circle</span>
                  ) : usernameAvailable === false ? (
                    <span className="material-symbols-outlined text-error text-[14px]">cancel</span>
                  ) : null}
                </div>
                {usernameAvailable === false && (
                  <p className="text-[10px] text-error font-bold mt-1 px-4">Username is already claimed.</p>
                )}
              </div>

              <Input 
                label="Age"
                placeholder="25"
                icon="calendar_today"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
              />
              
              <Input 
                label="Email address"
                placeholder="curator@gallery.com"
                icon="mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              
              <Input 
                label="Secure Password"
                placeholder="••••••••"
                icon="lock"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="pt-2">
                <Button 
                  variant="primary" 
                  className="w-full py-5 text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20" 
                  type="submit" 
                  disabled={loading || usernameAvailable === false || checkingUsername}
                >
                  {loading ? 'Initiating...' : 'Claim My Canvas'}
                </Button>
              </div>
            </form>

            <div className="text-center pt-8 border-t border-outline-variant/10">
              <p className="text-on-surface-variant font-body text-sm">
                Already part of the community?
                <Link 
                  href="/login" 
                  className="text-primary font-bold hover:underline ml-2"
                >
                  Enter the Gallery
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-20 md:mt-auto pt-10 text-center">
          <p className="text-[10px] text-on-surface-variant/40 font-bold uppercase tracking-widest max-w-[200px]">
            By joining, you agree to our curation standard and privacy terms.
          </p>
        </div>
      </div>
    </div>
  );
}

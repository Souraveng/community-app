'use client';

import React, { useEffect, useState } from 'react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const { user, loginWithGoogle, signInWithEmail } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = React.useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      await signInWithEmail(email, password);
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background font-body text-on-surface min-h-screen flex flex-col items-center justify-center p-6 selection:bg-primary-container selection:text-on-primary-container relative overflow-hidden">
      {/* Back Button */}
      <div className="absolute top-8 left-8 z-50">
        <button 
          onClick={() => router.back()}
          className="group flex items-center gap-3 px-6 py-3 rounded-2xl bg-surface-container-low/50 border border-outline-variant/10 hover:bg-surface-container-high transition-all ambient-shadow"
        >
          <span className="material-symbols-outlined text-sm transition-transform group-hover:-translate-x-1">arrow_back</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Gallery</span>
        </button>
      </div>

      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-40 overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] rounded-full bg-primary-container/20 blur-[120px]"></div>
        <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] rounded-full bg-secondary-container/20 blur-[120px]"></div>
        <div className="absolute top-[20%] left-[60%] w-[30%] h-[30%] rounded-full bg-tertiary-container/10 blur-[100px]"></div>
      </div>

      <main className="w-full max-w-[480px] z-10">
        {/* Logo & Title Section */}
        <div className="text-center mb-10 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-primary-container shadow-xl shadow-primary/10 mb-2">
            <span className="material-symbols-outlined text-on-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>gallery_thumbnail</span>
          </div>
          <h1 className="font-headlines text-3xl font-bold tracking-tight text-on-surface">
            Welcome Back
          </h1>
          <p className="text-on-surface-variant font-body">
            Continue your journey through the curated canvas.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-surface-container-lowest rounded-[2rem] p-8 md:p-10 ambient-shadow border border-outline-variant/10 relative overflow-hidden">
          {/* Social Logins */}
          <div className="mb-8">
            <button 
              onClick={loginWithGoogle}
              className="flex items-center justify-center gap-3 py-4 px-4 w-full rounded-full bg-surface-container-low hover:bg-surface-container-high transition-all text-xs font-bold text-on-surface ring-1 ring-outline-variant/10 uppercase tracking-widest active:scale-95"
            >
              <img 
                alt="Google" 
                className="w-5 h-5" 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              />
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="relative flex items-center mb-8">
            <div className="flex-grow border-t border-outline-variant/10"></div>
            <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40">Or use email</span>
            <div className="flex-grow border-t border-outline-variant/10"></div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-error-container text-on-error-container text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          {/* Auth Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input 
              label="Email address"
              placeholder="curator@gallery.com"
              icon="mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="block text-sm font-bold text-on-surface-variant ml-1">Password</label>
                <a className="text-xs font-bold text-primary hover:opacity-70 transition-opacity uppercase tracking-widest" href="#">Forgot?</a>
              </div>
              <Input 
                placeholder="••••••••"
                icon="lock"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

              <div className="flex items-center space-x-3 ml-1">
                <input className="w-4 h-4 rounded border-outline-variant/20 text-primary focus:ring-primary bg-surface-container-low" id="remember" type="checkbox" />
                <label className="text-xs font-bold text-on-surface-variant opacity-60 uppercase tracking-widest" htmlFor="remember">Remember for 30 days</label>
              </div>

            <Button variant="primary" className="w-full py-4 text-lg" type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Sign In'}
            </Button>
          </form>

          {/* Toggle Footer */}
          <div className="mt-8 text-center border-t border-outline-variant/10 pt-8">
            <p className="text-on-surface-variant font-body text-sm">
              Don't have an account?
              <Link 
                href="/signup" 
                className="text-primary font-bold hover:underline ml-2"
              >
                Join the community
              </Link>
            </p>
          </div>
        </div>

        {/* System Status/Footer */}
        <footer className="mt-12 flex flex-col items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-surface-container-low/50 border border-outline-variant/10">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant opacity-60">Authentication Encrypted</span>
          </div>
          <div className="flex gap-6">
            <a className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 hover:text-on-surface transition-colors" href="#">Privacy</a>
            <a className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 hover:text-on-surface transition-colors" href="#">Terms</a>
          </div>
        </footer>
      </main>
    </div>
  );
}

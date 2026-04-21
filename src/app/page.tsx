'use client';

import React, { useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/common/Button';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = React.useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !loading && user) {
      router.push('/home');
    }
  }, [user, loading, router, isMounted]);

  // If loading or user exists, we might want a brief loading state or just nothing (since we redirect)
  if (loading || user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 pt-24">
        {/* Hero Section */}
        <section className="relative px-6 py-20 lg:py-32 overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="z-10">
              <span className="inline-block px-4 py-1.5 bg-tertiary-container text-tertiary rounded-full text-sm font-semibold mb-6">
                Curated Discovery
              </span>
              <h1 className="font-headlines text-5xl lg:text-7xl font-extrabold tracking-tighter text-on-surface mb-6 leading-tight">
                Where Community <br /> Meets <span className="text-primary italic">Artistry.</span>
              </h1>
              <p className="text-lg lg:text-xl text-on-surface-variant max-w-lg mb-10 leading-relaxed font-body">
                A digital sanctuary for high-end discourse. Join a community where content isn't just posted—it's curated like a gallery.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/signup">
                  <button className="btn-primary px-8 py-4 text-lg">
                    Join the Community
                  </button>
                </Link>
                <Link href="/explore">
                  <button className="btn-secondary px-8 py-4 text-lg">
                    Explore Featured
                  </button>
                </Link>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-[2rem] blur-2xl group-hover:blur-3xl transition-all"></div>
              <div className="relative aspect-square rounded-[2rem] overflow-hidden shadow-2xl">
                <Image 
                  src="https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=2000"
                  alt="Modern art gallery interior"
                  fill
                  className="object-cover transform transition-transform duration-700 group-hover:scale-105"
                  preload={true}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Asymmetric Bento Grid Features */}
        <section className="px-6 py-24 bg-surface-container-low/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-headlines text-3xl lg:text-5xl font-bold tracking-tight mb-4 text-on-surface">Featured Exhibits</h2>
              <p className="text-on-surface-variant max-w-2xl mx-auto font-body">Our communities are organized as collections, not just lists. Experience discovery that flows organically.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Large Feature Card */}
              <div className="md:col-span-8 group relative overflow-hidden rounded-[2rem] bg-surface-container-lowest p-8 min-h-[400px] flex flex-col justify-end">
                <Image 
                  src="https://images.unsplash.com/photo-1544450614-74375d5e56bc?auto=format&fit=crop&q=80&w=2000"
                  alt="Art Gallery Exhibit"
                  fill
                  className="object-cover opacity-80 group-hover:scale-110 transition-transform duration-1000"
                  sizes="(max-width: 768px) 100vw, 66vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="relative z-10 text-white">
                  <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 inline-block">Curation</span>
                  <h3 className="text-3xl font-bold mb-2 font-headlines">The Art Gallery</h3>
                  <p className="text-white/80 max-w-sm font-body">Immerse yourself in a curated selection of fine art and digital masterpieces.</p>
                </div>
              </div>

              {/* Small Feature Card 1 */}
              <div className="md:col-span-4 bg-tertiary-container/30 rounded-[2rem] p-8 flex flex-col justify-between border border-tertiary-container/10">
                <div>
                  <span className="material-symbols-outlined text-4xl text-tertiary mb-4">palette</span>
                  <h3 className="text-2xl font-bold text-tertiary leading-tight font-headlines">Digital Artisans</h3>
                </div>
                <p className="text-on-surface-variant font-body mb-6">A space for digital painters and concept artists to share techniques.</p>
                <Button variant="ghost" className="w-fit bg-white text-tertiary font-bold shadow-sm">Explore</Button>
              </div>

              {/* Small Feature Card 2 */}
              <div className="md:col-span-4 bg-surface-container-lowest rounded-[2rem] p-8 ambient-shadow group hover:translate-y-[-4px] transition-all duration-300">
                <div className="aspect-video rounded-xl overflow-hidden mb-6 relative">
                  <Image 
                    src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000"
                    alt="Wilderness Lens"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <h3 className="text-xl font-bold mb-2 font-headlines text-on-surface">Wilderness Lens</h3>
                <p className="text-on-surface-variant text-sm mb-4 font-body">Capturing the raw beauty of the natural world through professional photography.</p>
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-zinc-200"></div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-zinc-300"></div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-zinc-400"></div>
                  <span className="pl-4 text-xs font-bold text-on-surface-variant flex items-center">+2.4k members</span>
                </div>
              </div>

              {/* Medium Feature Card */}
              <div className="md:col-span-8 bg-secondary-container/30 rounded-[2rem] p-10 flex items-center gap-8 overflow-hidden relative border border-secondary-container/10">
                <div className="relative z-10 max-w-md">
                  <h3 className="text-3xl font-bold text-secondary mb-4 font-headlines">The Curated Feed</h3>
                  <p className="text-on-surface-variant leading-relaxed mb-6 font-body">
                    Tired of algorithmic noise? The Gallery uses a human-led verification system to ensure only the highest quality content reaches your main exhibit.
                  </p>
                  <div className="flex items-center gap-4 text-secondary">
                    <span className="material-symbols-outlined">verified</span>
                    <span className="text-sm font-bold uppercase tracking-widest">Quality Guaranteed</span>
                  </div>
                </div>
                <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-64 h-64 bg-white/40 rounded-full blur-3xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="px-6 py-24 bg-surface-container-lowest">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-16 items-start">
              <div className="lg:sticky lg:top-32 w-full lg:w-1/3">
                <h2 className="font-headlines text-4xl lg:text-5xl font-extrabold tracking-tighter mb-6 text-on-surface">How The Gallery <br /> Works</h2>
                <p className="text-on-surface-variant leading-relaxed font-body">We've reimagined community building by applying the principles of physical galleries to digital spaces.</p>
                <div className="mt-10 p-6 bg-surface-container-low rounded-2xl border-l-4 border-primary">
                  <p className="text-sm font-medium text-primary mb-2 italic">"The internet's front room for quality discourse."</p>
                  <p className="text-xs text-on-surface-variant">— Creative Review</p>
                </div>
              </div>
              
              <div className="w-full lg:w-2/3 space-y-12">
                {[
                  { 
                    num: '01', 
                    title: 'Claim Your Canvas', 
                    desc: 'Start a community or join an existing one. Every space is a "Canvas" designed to showcase work with elegance.' 
                  },
                  { 
                    num: '02', 
                    title: 'Curate with Purpose', 
                    desc: 'Use our editorial tools to highlight the best posts. Move beyond simple upvotes with "Featured Slots" and "Collection Folders."' 
                  },
                  { 
                    num: '03', 
                    title: 'Build Your Legacy', 
                    desc: 'Our platform rewards long-term curation. Your profile grows as a recognized tastemaker in your chosen fields.' 
                  }
                ].map((step) => (
                  <div key={step.num} className="flex gap-8 items-start group">
                    <span className="text-6xl font-black text-primary/10 group-hover:text-primary/20 transition-colors duration-500">{step.num}</span>
                    <div>
                      <h4 className="text-2xl font-bold mb-3 font-headlines text-on-surface">{step.title}</h4>
                      <p className="text-on-surface-variant leading-relaxed font-body">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-24">
          <div className="max-w-5xl mx-auto bg-on-surface rounded-[3rem] p-12 lg:p-20 relative overflow-hidden text-center shadow-2xl">
            <div className="absolute inset-0 opacity-20">
              <Image 
                src="https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=2000"
                alt="Abstract background"
                fill
                className="object-cover"
                sizes="100vw"
              />
            </div>
            <div className="relative z-10">
              <h2 className="font-headlines text-4xl lg:text-6xl font-extrabold tracking-tighter text-white mb-8">Ready to curate your space?</h2>
              <p className="text-white/60 text-lg lg:text-xl mb-12 max-w-xl mx-auto font-body">
                Join 50,000+ creators and enthusiasts who have already claimed their place in The Gallery.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link href="/signup">
                  <button className="btn-primary px-10 py-4 text-lg">Get Started Today</button>
                </Link>
                <Link href="/explore">
                  <button className="btn-secondary text-on-surface border border-outline-variant/20 px-10 py-4 text-lg hover:bg-surface-container-low transition-all">Explore Galleries</button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}

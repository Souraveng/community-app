import React from 'react';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/Sidebar';
import PostCard from '../../components/common/PostCard';
import Button from '../../components/common/Button';
import Image from 'next/image';

const communityPosts = [
  {
    id: 'mock-1',
    user: 'alex_minimalist',
    userId: 'mock-user-1',
    timestamp: '4h ago',
    community: 'Case Study',
    title: 'The evolution of minimalist interfaces in high-end automotive design',
    content: 'Looking at how brands like Rivian and Polestar are redefining the digital dashboard by removing cognitive load through intentional whitespace and limited color palettes...',
    image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=2000',
    upvotes: '1.4k',
    comments: '128',
  },
  {
    id: 'mock-2',
    user: 'grid_master',
    userId: 'mock-user-2',
    timestamp: '8h ago',
    community: 'Discussion',
    title: 'Why we need to stop using 1px borders for everything',
    content: "Tonal depth is far more sophisticated than sharp lines. Let's discuss why background shifts are the future of premium UI design systems...",
    upvotes: '852',
    comments: '42',
  },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex pt-16">
        <Sidebar />
        
        <main className="flex-1 ml-0 md:ml-64 min-h-screen">
          {/* Community Banner & Header */}
          <header className="relative">
            <div className="h-48 md:h-64 w-full overflow-hidden relative">
              <Image 
                src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=2000"
                alt="r/design banner"
                fill
                className="object-cover"
                sizes="100vw"
              />
            </div>
            <div className="max-w-5xl mx-auto px-8">
              <div className="relative -mt-12 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8">
                <div className="flex items-end gap-6 text-on-surface">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-surface-container-lowest p-1 ambient-shadow">
                    <div className="w-full h-full rounded-2xl overflow-hidden bg-primary-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-primary-container text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        architecture
                      </span>
                    </div>
                  </div>
                  <div className="mb-2">
                    <h1 className="text-3xl md:text-4xl font-black font-headlines tracking-tighter">r/design</h1>
                    <p className="text-on-surface-variant font-medium font-body">1.2M Designers • 4.2k Active</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <Button variant="primary" className="px-8 py-3">Join Community</Button>
                  <button className="p-3 bg-surface-container-high rounded-full hover:bg-surface-container-highest transition-all text-on-surface">
                    <span className="material-symbols-outlined">share</span>
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Content Grid */}
          <div className="max-w-5xl mx-auto px-8 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Feed Section */}
            <div className="lg:col-span-8 space-y-10">
              {/* Sorting & Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-outline-variant/10">
                <button className="px-4 py-2 bg-surface-container-highest text-on-surface rounded-full text-sm font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">local_fire_department</span> Hot
                </button>
                <button className="px-4 py-2 hover:bg-surface-container-low text-on-surface-variant rounded-full text-sm font-medium flex items-center gap-2 transition-all">
                  <span className="material-symbols-outlined text-sm">new_releases</span> New
                </button>
              </div>

              {/* Posts */}
              <div className="space-y-8">
                {communityPosts.map((post, index) => (
                  <PostCard key={index} {...post} />
                ))}
              </div>
            </div>

            {/* Sidebar Section */}
            <aside className="lg:col-span-4 space-y-8">
              {/* About Card */}
              <section className="bg-surface-container-low/50 rounded-2xl p-6 space-y-4 border border-outline-variant/10">
                <h3 className="font-headlines font-bold text-on-surface">About Community</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed font-body">
                  The world's largest creative community for sharing and exploring high-end design, from architecture to digital interfaces. Curating the best of the aesthetic world.
                </p>
                <div className="flex items-center gap-4 py-4 border-y border-outline-variant/10">
                  <div>
                    <p className="text-lg font-bold font-headlines text-on-surface">1.2M</p>
                    <p className="text-[10px] uppercase tracking-tighter text-on-surface-variant/60 font-bold">Members</p>
                  </div>
                  <div className="w-px h-8 bg-outline-variant/20"></div>
                  <div>
                    <p className="text-lg font-bold font-headlines text-on-surface">4.2k</p>
                    <p className="text-[10px] uppercase tracking-tighter text-on-surface-variant/60 font-bold">Online</p>
                  </div>
                </div>
                <div className="space-y-3 pt-2 font-body text-on-surface-variant">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                    <span>Created Jan 12, 2011</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-sm">public</span>
                    <span>Public Community</span>
                  </div>
                </div>
              </section>

              {/* Rules Card */}
              <section className="bg-surface-container-low/50 rounded-2xl p-6 space-y-4 border border-outline-variant/10">
                <h3 className="font-headlines font-bold text-on-surface">Community Rules</h3>
                <div className="space-y-4 font-body">
                  {['Keep it aesthetic', 'Credit the creator', 'No low-effort posts'].map((rule, i) => (
                    <div key={i} className="group border-b border-outline-variant/5 last:border-0 pb-2 cursor-pointer">
                      <button className="w-full flex justify-between items-center text-left hover:text-primary transition-colors">
                        <span className="text-sm font-bold">{i+1}. {rule}</span>
                        <span className="material-symbols-outlined text-sm">expand_more</span>
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Related Galleries */}
              <section className="space-y-4">
                <h3 className="font-headlines font-bold text-on-surface px-1 text-sm uppercase tracking-widest opacity-60">Related Galleries</h3>
                <div className="grid grid-cols-2 gap-3">
                  <a className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-900" href="#">
                    <Image 
                      src="https://images.unsplash.com/photo-1574352067721-72d5913bd35c?auto=format&fit=crop&q=80&w=2000"
                      alt="r/arch"
                      fill
                      className="object-cover opacity-60 group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 1024px) 25vw, 150px"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-xs font-bold text-white font-headlines">r/arch</p>
                    </div>
                  </a>
                  <a className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-900" href="#">
                    <Image 
                      src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000"
                      alt="r/tech_art"
                      fill
                      className="object-cover opacity-60 group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 1024px) 25vw, 150px"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-xs font-bold text-white font-headlines">r/tech_art</p>
                    </div>
                  </a>
                </div>
              </section>
            </aside>
          </div>
        </main>
      </div>

      {/* FAB for Mobile */}
      <button className="md:hidden fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-95 transition-transform ambient-shadow">
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  );
}

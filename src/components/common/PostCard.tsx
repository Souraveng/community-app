'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useVotes } from '../../hooks/useVotes';
import { formatDistanceToNow } from 'date-fns';
import DeleteDialog from './DeleteDialog';
import Link from 'next/link';

interface PostCardProps {
  id: string;
  user: string;
  userId: string;
  avatar?: string | null;
  timestamp: string;
  community: string;
  title: string;
  content?: string;
  image?: string | null;
  videoUrl?: string | null;
  upvotes: number;
  comments: number;
  autoplay?: boolean;
  showDelete?: boolean;
  onDelete?: (id: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  id,
  user,
  userId,
  avatar,
  timestamp,
  community,
  title,
  content,
  image,
  videoUrl,
  upvotes,
  comments,
  autoplay = true,
  showDelete = false,
  onDelete,
}) => {
  const { user: authUser } = useAuth();
  const { userVote, vote, loading: votesLoading } = useVotes(id);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Format relative timestamp
  const relativeTime = React.useMemo(() => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Recently';
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return 'Recently';
    }
  }, [timestamp]);

  const handleVote = async (type: 1 | -1) => {
    if (!authUser) {
      // Potentially trigger a login modal or alert
      return;
    }
    await vote(type);
  };

  const confirmDelete = async () => {
    setIsDialogOpen(false);
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
      if (onDelete) onDelete(id);
    } catch (err) {
      console.error('Error deleting post:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DeleteDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={confirmDelete}
      />
      
      <article className="group bg-surface-container-low/30 p-6 rounded-[2.5rem] hover:bg-surface-container-lowest hover:ambient-shadow transition-all duration-300">
        <div className="flex gap-6">
          {/* Voting Column (reddit-Style) */}
          <div className="flex flex-col items-center gap-1">
            <button 
              onClick={() => handleVote(1)}
              disabled={votesLoading}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                userVote === 1 
                  ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                  : 'hover:bg-primary/10 text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-2xl font-black">arrow_upward</span>
            </button>
            
            <span className={`font-headlines font-black text-sm transition-colors ${
              userVote === 1 ? 'text-primary' : userVote === -1 ? 'text-secondary' : 'text-on-surface'
            }`}>
              {upvotes >= 1000 ? `${(upvotes / 1000).toFixed(1)}k` : upvotes}
            </span>
            
            <button 
              onClick={() => handleVote(-1)}
              disabled={votesLoading}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                userVote === -1 
                  ? 'bg-secondary text-on-secondary shadow-lg shadow-secondary/20' 
                  : 'hover:bg-secondary/10 text-on-surface-variant hover:text-secondary'
              }`}
            >
              <span className="material-symbols-outlined text-2xl font-black">arrow_downward</span>
            </button>
          </div>
          
          {/* Content Column */}
          <div className="flex-1 min-w-0">
            {/* User Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full overflow-hidden relative border border-outline-variant/10 shadow-sm">
                {avatar ? (
                  <Image src={avatar} alt={user} fill className="object-cover" sizes="40px" />
                ) : (
                  <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
                    <span className="material-symbols-outlined text-zinc-400">account_circle</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-headlines font-black text-xs uppercase tracking-widest text-on-surface truncate">u/{user}</span>
                  <span className="w-1 h-1 rounded-full bg-on-surface-variant/20"></span>
                  {community && community.startsWith('c:') ? (
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary">
                      g/{community.replace('c:', '')}
                    </span>
                  ) : community && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                      c/{community}
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-[0.2em] mt-0.5">{relativeTime}</p>
              </div>

              {showDelete && authUser?.uid === userId && (
                <button 
                  onClick={() => setIsDialogOpen(true)}
                  disabled={isDeleting}
                  className="p-2 rounded-full text-on-surface-variant/40 hover:text-error hover:bg-error/10 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">{isDeleting ? 'refresh' : 'delete'}</span>
                </button>
              )}
            </div>

            <Link href={`/post/${id}`}>
              <h2 className="text-xl md:text-2xl font-black font-headlines tracking-tighter text-on-surface mb-3 group-hover:text-primary transition-colors cursor-pointer leading-tight">
                {title}
              </h2>
            </Link>
            
            {content && <p className="text-sm font-body text-on-surface-variant/80 mb-6 line-clamp-3 leading-relaxed">{content}</p>}

            {/* Media Section */}
            {(videoUrl || image) && (
              <Link href={`/post/${id}`}>
                <div className="rounded-[2rem] overflow-hidden aspect-video mb-6 cursor-pointer relative group/img bg-surface-container-highest border border-outline-variant/10 shadow-sm">
                    {videoUrl ? (
                      <video src={videoUrl} autoPlay={autoplay} muted loop playsInline className="w-full h-full object-cover" />
                    ) : (
                      image && (
                        <Image 
                          src={image} 
                          alt={title} 
                          fill 
                          className="object-cover transition-transform duration-700 group-hover/img:scale-105" 
                          sizes="(max-width: 768px) 100vw, 800px"
                        />
                      )
                    )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
                </div>
              </Link>
            )}

            <div className="flex items-center gap-6">
              <Link href={`/post/${id}`} className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 px-4 py-2 rounded-full border border-primary/10 transition-all">
                <span className="material-symbols-outlined text-sm">mode_comment</span>
                {comments} Intelligence
              </Link>
              <button className="flex items-center gap-2 text-on-surface-variant font-black text-[10px] uppercase tracking-widest hover:text-primary transition-all">
                <span className="material-symbols-outlined text-sm">share</span>
                Share
              </button>
              <button className="flex items-center gap-2 text-on-surface-variant font-black text-[10px] uppercase tracking-widest hover:text-primary transition-all ml-auto">
                <span className="material-symbols-outlined text-sm">bookmark</span>
              </button>
            </div>
          </div>
        </div>
      </article>
    </>
  );
};

export default PostCard;

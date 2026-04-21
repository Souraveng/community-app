'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  id: string;
  user: string;
  userId: string; // Required for deletion check
  avatar?: string | null;
  timestamp: string;
  community: string;
  title: string;
  content?: string;
  image?: string | null;
  videoUrl?: string | null;
  upvotes: string | number;
  comments: string | number;
  autoplay?: boolean;
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
  upvotes: initialUpvotes,
  comments,
  autoplay = true,
  onDelete,
}) => {
  const { user: authUser } = useAuth();
  const [voteCount, setVoteCount] = useState(
    typeof initialUpvotes === 'string' 
      ? (parseInt(initialUpvotes.replace('k', '000').replace('.', '')) || 0) 
      : initialUpvotes
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to remove this exhibit from the gallery?')) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
      if (onDelete) onDelete(id);
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article className="group bg-surface-container-low/30 p-6 rounded-[2.5rem] hover:bg-surface-container-lowest hover:ambient-shadow transition-all duration-300">
      <div className="flex gap-6">
        {/* Voting Column */}
        <div className="flex flex-col items-center gap-2">
          <button className="w-10 h-10 rounded-full hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-all flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">arrow_upward</span>
          </button>
          <span className="font-headlines font-black text-sm text-on-surface">{voteCount >= 1000 ? `${(voteCount / 1000).toFixed(1)}k` : voteCount}</span>
          <button className="w-10 h-10 rounded-full hover:bg-secondary/10 text-on-surface-variant hover:text-secondary transition-all flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">arrow_downward</span>
          </button>
        </div>
        
        {/* Content Column */}
        <div className="flex-1 min-w-0">
          {/* User Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full overflow-hidden relative border border-outline-variant/10">
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
                 <span className="text-[10px] font-black uppercase tracking-widest text-primary">g/{community}</span>
              </div>
              <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest mt-0.5">{timestamp}</p>
            </div>

            {/* Delete Option - Author Only */}
            {authUser?.uid === userId && (
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 rounded-full text-on-surface-variant/40 hover:text-error hover:bg-error/10 transition-all"
                title="Delete Exhibit"
              >
                {isDeleting ? (
                  <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">delete</span>
                )}
              </button>
            )}
          </div>

          <h2 className="text-xl md:text-2xl font-black font-headlines tracking-tighter text-on-surface mb-3 group-hover:text-primary transition-colors cursor-pointer">
            {title}
          </h2>
          
          {content && <p className="text-sm font-body text-on-surface-variant mb-6 line-clamp-3 leading-relaxed">{content}</p>}

          {/* Media Section */}
          {(videoUrl || image) && (
            <div className="rounded-2xl overflow-hidden aspect-video mb-6 cursor-pointer relative group/img bg-surface-container-highest border border-outline-variant/5">
                {videoUrl ? (
                  <video 
                    src={videoUrl} 
                    autoPlay={autoplay} 
                    muted 
                    loop 
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  image && (
                    <Image 
                      src={image} 
                      alt={title} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover/img:scale-105" 
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  )
                )}
              <div className="absolute inset-0 bg-black/5 group-hover/img:bg-transparent transition-all pointer-events-none" />
            </div>
          )}

          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 text-primary font-bold text-xs hover:opacity-70 transition-all">
              <span className="material-symbols-outlined text-sm">mode_comment</span>
              {comments} Comments
            </button>
            <button className="flex items-center gap-2 text-on-surface-variant font-bold text-xs hover:text-primary transition-all">
              <span className="material-symbols-outlined text-sm">share</span>
              Share
            </button>
            <button className="flex items-center gap-2 text-on-surface-variant font-bold text-xs hover:text-primary transition-all">
              <span className="material-symbols-outlined text-sm">bookmark</span>
              Save
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostCard;

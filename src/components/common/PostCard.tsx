'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface PostCardProps {
  id: string;
  user: string;
  avatar?: string;
  timestamp: string;
  community: string;
  title: string;
  content?: string;
  image?: string | null;
  videoUrl?: string | null;
  upvotes: string;
  comments: string;
  autoplay?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({
  id,
  user,
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
}) => {
  const { user: authUser } = useAuth();
  const [voteCount, setVoteCount] = useState(initialUpvotes ? (parseInt(initialUpvotes.replace('k', '000').replace('.', '')) || 0) : 0);
  const [userVote, setUserVote] = useState<number | null>(null);

  // ... existing useEffect ...

  return (
    <article className="group bg-surface-container-low/30 p-6 rounded-[2.5rem] hover:bg-surface-container-lowest hover:ambient-shadow transition-all duration-300">
      <div className="flex gap-6">
        {/* Voting Column omitted for brevity in targetContent match - assuming same structure */}
        <div className="flex flex-col items-center gap-2">
           {/* ... Voting buttons ... */}
        </div>
        
        {/* Content Column */}
        <div className="flex-1">
          {/* ... User Header ... */}

          {/* Media Section */}
          {(videoUrl || image) && (
            <div className="rounded-2xl overflow-hidden aspect-video mb-4 cursor-pointer relative group/img bg-surface-container-highest">
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

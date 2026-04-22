'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useSavedPosts } from '../../hooks/useSavedPosts';
import { useVotes } from '../../hooks/useVotes';
import { useFollows } from '../../hooks/useFollows';
import { formatDistanceToNow } from 'date-fns';
import DeleteDialog from './DeleteDialog';
import Link from 'next/link';
import ImageModal from './ImageModal';

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
  comments: number;
  votes: number;
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
  comments,
  votes: initialVotes,
  autoplay = true,
  showDelete = false,
  onDelete,
}) => {
  const { user: authUser } = useAuth();
  const { isSaved, toggleSave } = useSavedPosts(id);
  const { userVote, vote, upvoteCount, downvoteCount } = useVotes(id);
  const { isFollowing, follow, unfollow } = useFollows(userId);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const handleFollow = async () => {
    if (!authUser) return;
    if (isFollowing) {
      await unfollow();
    } else {
      await follow();
    }
  };

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

  const handleSave = async () => {
    if (!authUser) return;
    await toggleSave();
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

              {/* Follow Button */}
              {authUser && authUser.uid !== userId && (
                <button 
                  onClick={handleFollow}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    isFollowing 
                    ? 'bg-surface-container-highest text-on-surface-variant hover:bg-error/10 hover:text-error' 
                    : 'bg-primary text-on-primary hover:scale-105 active:scale-95'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}

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
              <div className="relative group/img aspect-video mb-6 rounded-[2rem] overflow-hidden border border-outline-variant/10 shadow-sm bg-surface-container-highest">
                {videoUrl ? (
                  <Link href={`/post/${id}`} className="block w-full h-full">
                    <video src={videoUrl} autoPlay={autoplay} muted loop playsInline className="w-full h-full object-cover" />
                  </Link>
                ) : (
                  image && (
                    <div 
                      className="w-full h-full cursor-zoom-in relative"
                      onClick={() => setShowImageModal(true)}
                    >
                      <Image 
                        src={image} 
                        alt={title} 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover/img:scale-105" 
                        sizes="(max-width: 768px) 100vw, 800px"
                      />
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-4xl scale-50 group-hover/img:scale-100 transition-transform duration-500">zoom_in</span>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            <div className="flex items-center gap-6">
              <div className="flex items-center bg-surface-container-low border border-outline-variant/10 rounded-full px-2">
                <button 
                  onClick={() => vote(1)}
                  className={`p-2 transition-all hover:scale-110 active:scale-95 ${userVote === 1 ? 'text-primary' : 'text-on-surface-variant'}`}
                >
                  <span className={`material-symbols-outlined text-lg ${userVote === 1 ? 'fill-1' : ''}`}>arrow_upward</span>
                </button>
                
                {/* Always show upvote count */}
                <span className="text-[10px] font-black w-4 text-center">{upvoteCount}</span>

                <button 
                  onClick={() => vote(-1)}
                  className={`p-2 transition-all hover:scale-110 active:scale-95 ${userVote === -1 ? 'text-secondary' : 'text-on-surface-variant'}`}
                >
                  <span className={`material-symbols-outlined text-lg ${userVote === -1 ? 'fill-1' : ''}`}>arrow_downward</span>
                </button>

                {/* Only show downvote count to the owner */}
                {authUser?.uid === userId && downvoteCount > 0 && (
                  <span className="text-[10px] font-black w-4 text-center text-secondary opacity-60 mr-2">-{downvoteCount}</span>
                )}
              </div>

              <Link href={`/post/${id}`} className="flex items-center gap-2 text-on-surface-variant font-black text-[10px] uppercase tracking-widest hover:text-primary transition-all">
                <span className="material-symbols-outlined text-sm">mode_comment</span>
                {comments} Comment
              </Link>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigator.clipboard.writeText(`${window.location.origin}/post/${id}`);
                  const btn = e.currentTarget;
                  const originalText = btn.innerHTML;
                  btn.innerHTML = '<span class="material-symbols-outlined text-sm">check</span> Copied!';
                  setTimeout(() => { btn.innerHTML = originalText; }, 2000);
                }}
                className="flex items-center gap-2 text-on-surface-variant font-black text-[10px] uppercase tracking-widest hover:text-primary transition-all"
              >
                <span className="material-symbols-outlined text-sm">share</span>
                Share
              </button>
              <button 
                onClick={handleSave}
                className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all ml-auto ${
                  isSaved ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <span className={`material-symbols-outlined text-sm ${isSaved ? 'fill-1' : ''}`}>
                  {isSaved ? 'bookmark_added' : 'bookmark'}
                </span>
                {isSaved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </article>

      {showImageModal && image && (
        <ImageModal 
          imageUrl={image} 
          title={title} 
          onClose={() => setShowImageModal(false)}
        />
      )}
    </>
  );
};

export default PostCard;

'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '../../../components/layout/Navbar';
import Sidebar from '../../../components/layout/Sidebar';
import Image from 'next/image';
import Button from '../../../components/common/Button';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { useProfile } from '../../../hooks/useProfile';
import { useComments } from '../../../hooks/useComments';
import CommentItem from '../../../components/common/CommentItem';
import { renderSecureContent } from '../../../lib/security';

export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  
  const [post, setPost] = useState<any>(null);
  const { comments, loading: commentsLoading, addComment } = useComments(id as string);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    async function fetchPostData() {
      if (!id) return;
      
      try {
        // Fetch Post
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', id)
          .single();
        
        if (postError) throw postError;
        setPost(postData);
      } catch (err) {
        console.error('Error fetching post data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPostData();
  }, [id]);

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    const success = await addComment(newComment);
    if (success) {
      setNewComment('');
    }
    setPosting(false);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Navbar /><span className="material-symbols-outlined animate-spin text-4xl text-primary">circle_notifications</span></div>;
  if (!post) return <div className="min-h-screen bg-background flex items-center justify-center font-headlines text-2xl"><Navbar />Post not found.</div>;

  // Authentication Guard for Post Detail
  if (!user) {
    return (
      <div className="min-h-screen bg-background text-on-surface">
        <Navbar />
        <div className="flex pt-16 h-[calc(100vh-64px)] items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-8 bg-surface-container-low/20 backdrop-blur-xl p-12 rounded-[3rem] border border-outline-variant/10 ambient-shadow">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto">
              <span className="material-symbols-outlined text-4xl">lock</span>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-black font-headlines tracking-tighter">Collector Access Required</h1>
              <p className="text-on-surface-variant font-body opacity-70">This exhibit is part of a curated network. Sign in to view and engage with this intelligence.</p>
            </div>
            <Button variant="primary" className="w-full py-4 font-black uppercase tracking-widest text-xs" onClick={() => router.push('/login')}>
              Unlock with Identity
            </Button>
            <p className="text-[10px] uppercase font-black tracking-widest opacity-30">Security Protocol Alpha-6</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface select-none">
      <Navbar />
      
      <div className="flex pt-16">
        <Sidebar mb-visible={false} />
        
        <main className="flex-1 ml-0 lg:ml-64 p-4 md:p-8 max-w-5xl mx-auto w-full">
          {/* Post Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-tertiary-container text-tertiary px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">{post.community_name}</span>
              <span className="text-xs text-on-surface-variant flex items-center gap-1 font-body">
                <span className="material-symbols-outlined text-xs">history</span> {new Date(post.created_at).toLocaleDateString()}
              </span>
              <span className="text-on-surface-variant">• u/{post.username}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold font-headlines text-on-surface tracking-tight leading-tight mb-6">
              {post.title}
            </h1>
          </div>

          {/* Post Content */}
          <article className="bg-surface-container-lowest rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl shadow-black/5 mb-12 border border-outline-variant/5">
            {post.image_url && (
              <div className="w-full relative aspect-video md:aspect-[21/9]">
                <Image 
                  src={post.image_url} 
                  alt={post.title} 
                  fill 
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-6 md:p-12">
              <div className="font-body text-on-surface text-lg md:text-xl leading-relaxed space-y-6">
                <p>{renderSecureContent(post.content)}</p>
              </div>
            </div>
          </article>

          {/* Comments Section */}
          <section className="space-y-12 pb-24">
            <h3 className="font-headlines font-extrabold text-2xl text-on-surface border-b border-outline-variant/10 pb-6">
              Conversation <span className="text-on-surface-variant font-medium opacity-60">
                ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
              </span>
            </h3>

            {/* Comment Input */}
            {user ? (
              <div className="bg-surface-container-low/30 p-6 rounded-[2rem] border border-outline-variant/10">
                <textarea 
                  className="w-full bg-surface-container-lowest border-none rounded-2xl p-4 text-sm focus:ring-1 focus:ring-primary min-h-[120px] font-body text-on-surface placeholder:text-on-surface-variant/40" 
                  placeholder="Join the collective briefing..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                ></textarea>
                <div className="flex justify-end mt-4">
                  <Button variant="primary" onClick={handlePostComment} disabled={posting || !newComment.trim()}>
                    {posting ? 'Transmitting...' : 'Post Intelligence'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-surface-container-low/30 p-8 rounded-[2rem] text-center border border-dashed border-outline-variant/20">
                <p className="text-on-surface-variant font-bold mb-4">You must be signed in to join the conversation.</p>
                <Button variant="secondary" onClick={() => router.push('/login')}>Sign In to Comment</Button>
              </div>
            )}

            {/* Comment Feed */}
            <div className="space-y-10">
              {commentsLoading ? (
                <div className="flex justify-center py-10">
                  <span className="material-symbols-outlined animate-spin opacity-20">refresh</span>
                </div>
              ) : comments.map((comment) => (
                <CommentItem 
                  key={comment.id} 
                  comment={comment} 
                  onReply={addComment} 
                />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

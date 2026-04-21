'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Button from './Button';
import { Comment } from '../../hooks/useComments';
import { renderSecureContent } from '../../lib/security';

interface CommentItemProps {
  comment: Comment;
  onReply: (content: string, parentId: string) => Promise<any>;
  depth?: number;
}

export default function CommentItem({ comment, onReply, depth = 0 }: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      await onReply(replyContent, comment.id);
      setReplyContent('');
      setIsReplying(false);
    } catch (err) {
      console.error('Failed to reply:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`relative ${depth > 0 ? 'ml-4 md:ml-8 mt-4' : 'mb-8'}`}>
      {/* Thread Line - reddit style */}
      {depth > 0 && (
        <div 
          className="absolute left-[-16px] md:left-[-32px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-outline-variant/20 via-outline-variant/10 to-transparent hover:from-primary/40 cursor-pointer transition-all"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand thread" : "Collapse thread"}
        />
      )}

      <div className="flex gap-4 group">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-[1rem] overflow-hidden relative border border-outline-variant/10 flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
            {comment.profiles?.avatar_url ? (
              <Image src={comment.profiles.avatar_url} alt={comment.profiles.username} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-xl">person</span>
              </div>
            )}
          </div>
          {/* Vertical line connector if there are replies and not collapsed */}
          {!collapsed && comment.replies && comment.replies.length > 0 && (
             <div className="w-[2px] flex-1 bg-outline-variant/10 mt-2 mb-2" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="bg-surface-container-low/10 p-5 rounded-[2rem] hover:bg-white hover:shadow-lg hover:shadow-on-background/5 transition-all border border-transparent hover:border-outline-variant/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-headlines font-black text-xs text-on-surface tracking-tight">
                  u/{comment.profiles?.username || 'curator'}
                </span>
                <span className="text-[9px] uppercase font-bold text-on-surface-variant/30 tracking-widest">
                  {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {collapsed && (
                   <span className="text-[10px] font-bold text-primary/40 ml-2 italic">[Thread Collapsed]</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setCollapsed(!collapsed)}
                  className="material-symbols-outlined text-xs text-on-surface-variant/20 hover:text-primary transition-colors"
                >
                  {collapsed ? 'unfold_more' : 'unfold_less'}
                </button>
                <button 
                  onClick={() => setIsReplying(!isReplying)}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:scale-110 active:scale-95 transition-all"
                >
                  Reply
                </button>
              </div>
            </div>
            
            {!collapsed && (
              <p className="text-on-surface/80 leading-relaxed text-sm font-body">
                {renderSecureContent(comment.content)}
              </p>
            )}
          </div>

          {!collapsed && isReplying && (
            <div className="mt-4 bg-white p-6 rounded-[2rem] border border-primary/10 shadow-xl shadow-primary/5 animate-in fade-in slide-in-from-top-2 z-10">
              <textarea 
                className="w-full bg-surface-container-lowest/30 border-none rounded-2xl p-4 text-sm focus:ring-1 focus:ring-primary min-h-[100px] font-body text-on-surface placeholder:text-on-surface-variant/30" 
                placeholder={`Briefing u/${comment.profiles?.username}...`}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                autoFocus
              ></textarea>
              <div className="flex justify-end gap-3 mt-4">
                <button 
                  onClick={() => setIsReplying(false)}
                  className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 px-4"
                >
                  Abort
                </button>
                <Button variant="primary" className="px-8 py-3 text-[10px] rounded-full" onClick={handleReply} disabled={submitting || !replyContent.trim()}>
                  {submitting ? 'Transmitting...' : 'Dispatch Intel'}
                </Button>
              </div>
            </div>
          )}

          {!collapsed && comment.replies && comment.replies.length > 0 && (
            <div className="space-y-2">
              {comment.replies.map((reply) => (
                <CommentItem 
                  key={reply.id} 
                  comment={reply} 
                  onReply={onReply} 
                  depth={depth + 1} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

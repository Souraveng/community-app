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
    <div className={`space-y-4 ${depth > 0 ? 'ml-6 md:ml-10 border-l border-outline-variant/10 pl-6 md:pl-8' : ''}`}>
      <div className="flex gap-4 group">
        <div className="w-10 h-10 rounded-[1rem] overflow-hidden relative border border-outline-variant/10 flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
          {comment.profiles?.avatar_url ? (
            <Image src={comment.profiles.avatar_url} alt={comment.profiles.username} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant text-xl">person</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 bg-surface-container-low/10 p-4 rounded-3xl hover:bg-surface-container-low/20 transition-all border border-transparent hover:border-outline-variant/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-headlines font-black text-xs text-on-surface tracking-tight">
                u/{comment.profiles?.username || 'curator'}
              </span>
              <span className="text-[9px] uppercase font-bold text-on-surface-variant opacity-30 tracking-widest">
                {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <button 
              onClick={() => setIsReplying(!isReplying)}
              className="text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
            >
              Reply
            </button>
          </div>
          
          <p className="text-on-surface/90 leading-relaxed text-sm font-body">
            {renderSecureContent(comment.content)}
          </p>
        </div>
      </div>

      {isReplying && (
        <div className="ml-14 bg-surface-container-low/40 p-5 rounded-3xl border border-primary/10 animate-in fade-in slide-in-from-top-2">
          <textarea 
            className="w-full bg-surface-container-lowest/50 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary min-h-[80px] font-body text-on-surface placeholder:text-on-surface-variant/30" 
            placeholder={`Reply to u/${comment.profiles?.username}...`}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            autoFocus
          ></textarea>
          <div className="flex justify-end gap-3 mt-3">
            <button 
              onClick={() => setIsReplying(false)}
              className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100"
            >
              Cancel
            </button>
            <Button variant="primary" className="px-5 py-2 text-[10px]" onClick={handleReply} disabled={submitting || !replyContent.trim()}>
              {submitting ? 'Transmitting...' : 'Dispatch Reply'}
            </Button>
          </div>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-4 pt-2">
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
  );
}

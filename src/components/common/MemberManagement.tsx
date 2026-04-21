'use client';

import React, { useState, useEffect } from 'react';
import Button from './Button';

interface Profile {
  username: string;
  avatar_url?: string;
  full_name?: string;
}

interface PendingRequest {
  user_id: string;
  joined_at: string;
  profiles: Profile;
}

interface MemberManagementProps {
  requests: PendingRequest[];
  onResolve: (userId: string, approve: boolean) => Promise<void>;
}

export default function MemberManagement({ requests: initialRequests, onResolve }: MemberManagementProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    setRequests(initialRequests);
  }, [initialRequests]);

  const handleAction = async (userId: string, approve: boolean) => {
    setLoadingId(userId);
    try {
      await onResolve(userId, approve);
      setRequests(prev => prev.filter(r => r.user_id !== userId));
    } finally {
      setLoadingId(null);
    }
  };

  if (requests.length === 0) return null;

  return (
    <div className="bg-surface-container-lowest rounded-[2rem] border border-primary/20 p-8 mb-12 ambient-shadow relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
      
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary">group_add</span>
        </div>
        <div>
          <h2 className="text-xl font-headlines font-extrabold text-on-surface">Curation Requests</h2>
          <p className="text-sm text-on-surface-variant font-medium">Potential collectors waiting to join your gallery</p>
        </div>
        <div className="ml-auto bg-primary text-on-primary px-3 py-1 rounded-full text-xs font-black">
          {requests.length}
        </div>
      </div>

      <div className="space-y-4">
        {requests.map((request) => (
          <div 
            key={request.user_id}
            className="flex items-center justify-between p-4 bg-surface-container-high/40 rounded-2xl border border-outline-variant/10 hover:border-primary/20 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-surface-container-high">
                {request.profiles?.avatar_url ? (
                  <img src={request.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {request.profiles?.username?.[0] || '?'}
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-bold text-on-surface">@{request.profiles?.username}</h4>
                <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest leading-none mt-1">
                  Requested {new Date(request.joined_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                className="rounded-xl px-6 py-2 h-auto text-[10px] font-black uppercase tracking-widest"
                disabled={loadingId === request.user_id}
                onClick={() => handleAction(request.user_id, true)}
              >
                {loadingId === request.user_id ? 'Wait...' : 'Approve'}
              </Button>
              <Button
                variant="outline"
                className="rounded-xl px-6 py-2 h-auto text-[10px] font-black uppercase tracking-widest shadow-none border-outline-variant/20"
                disabled={loadingId === request.user_id}
                onClick={() => handleAction(request.user_id, false)}
              >
                Decline
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

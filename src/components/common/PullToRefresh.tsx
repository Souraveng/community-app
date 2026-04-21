'use client';

import React, { useState, useEffect, useRef } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  
  const PULL_THRESHOLD = 80;
  const MAX_PULL = 150;

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only allow pull if at the top of the page
    if (window.scrollY === 0) {
      startY.current = e.touches[0].pageY;
    } else {
      startY.current = -1;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === -1 || isRefreshing) return;

    const currentY = e.touches[0].pageY;
    const distance = currentY - startY.current;

    if (distance > 0) {
      setPulling(true);
      // Dampening effect
      const dampedDistance = Math.min(distance * 0.5, MAX_PULL);
      setPullDistance(dampedDistance);
      
      // Prevent scrolling while pulling
      if (distance > 5) {
        if (e.cancelable) e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!pulling) return;

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD / 2);
      await onRefresh();
      setIsRefreshing(false);
    }

    setPulling(false);
    setPullDistance(0);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Refresh Indicator */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-50 flex flex-col items-center gap-2 transition-all duration-300"
        style={{ 
          top: `${pullDistance - 40}px`, 
          opacity: pullDistance / PULL_THRESHOLD,
          transform: `translateX(-1/2) scale(${Math.min(pullDistance / PULL_THRESHOLD, 1)})`
        }}
      >
        <div className="bg-white rounded-full p-2 shadow-xl border border-outline-variant/10">
          <span className={`material-symbols-outlined text-primary text-2xl ${isRefreshing ? 'animate-spin' : ''}`}
            style={{ transform: !isRefreshing ? `rotate(${pullDistance * 2}deg)` : 'none' }}>
            {isRefreshing ? 'sync' : 'expand_more'}
          </span>
        </div>
        {!isRefreshing && pullDistance > 40 && (
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 italic">
            {pullDistance > PULL_THRESHOLD ? 'Release to Sync' : 'Pull to Refresh'}
          </span>
        )}
      </div>

      <div 
        style={{ 
          transform: `translateY(${isRefreshing ? PULL_THRESHOLD / 2 : pullDistance / 2}px)`,
          transition: pulling ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)'
        }}
        className="w-full"
      >
        {children}
      </div>
    </div>
  );
}

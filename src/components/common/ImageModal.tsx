'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';

interface ImageModalProps {
  imageUrl: string;
  title?: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, title, onClose }) => {
  // Prevent scrolling when modal is open and add keyboard support
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 md:p-10 animate-fade-in overflow-hidden"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
      
      {/* Close Button */}
      <button 
        className="absolute top-6 right-6 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all group border border-white/10"
        onClick={onClose}
      >
        <span className="material-symbols-outlined text-white transition-transform group-hover:rotate-90">close</span>
      </button>

      {/* Image Container */}
      <div 
        className="relative z-10 w-full max-w-7xl max-h-[90vh] flex flex-col items-center justify-center gap-8 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full flex-1 min-h-0 flex items-center justify-center">
          <img 
            src={imageUrl} 
            alt={title || 'Full Resolution'} 
            className="max-w-full max-h-[75vh] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform"
          />
        </div>
        
        {title && (
          <div className="text-center px-6 pb-2">
            <h3 className="text-2xl md:text-3xl font-black font-headlines text-white tracking-widest uppercase leading-tight">{title}</h3>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.4em] mt-3">Full Definition • {new Date().getFullYear()}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageModal;

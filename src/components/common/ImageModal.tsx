'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';

interface ImageModalProps {
  imageUrl: string;
  title?: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, title, onClose }) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-fade-in"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
      
      {/* Close Button */}
      <button 
        className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all group"
        onClick={onClose}
      >
        <span className="material-symbols-outlined text-white transition-transform group-hover:rotate-90">close</span>
      </button>

      {/* Image Container */}
      <div 
        className="relative w-full h-full flex flex-col items-center justify-center gap-6 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-full max-w-6xl max-h-[85vh]">
          <Image 
            src={imageUrl} 
            alt={title || 'Full Resolution'} 
            fill 
            className="object-contain drop-shadow-2xl"
            priority
          />
        </div>
        
        {title && (
          <div className="text-center">
            <h3 className="text-2xl font-black font-headlines text-white tracking-widest uppercase">{title}</h3>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mt-2">Natural Aspect Ratio</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageModal;

'use client';

import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  title,
  maxWidth = "max-w-2xl"
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-500" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className={`relative w-full ${maxWidth} transform transition-all animate-in fade-in zoom-in slide-in-from-bottom-8 duration-500 ease-out py-8`}>
        <div className="bg-surface-container-high/80 backdrop-blur-3xl border border-white/20 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-4 flex items-center justify-between">
            <h3 className="text-2xl font-black font-headlines tracking-tighter text-on-surface uppercase italic">
              {title || 'Exhibit'}
            </h3>
            <button 
              onClick={onClose}
              className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-on-surface hover:bg-white/10 active:scale-90 transition-all border border-white/5"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;

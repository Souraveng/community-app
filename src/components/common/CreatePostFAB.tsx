'use client';

import React from 'react';

interface CreatePostFABProps {
  onClick: () => void;
  label?: string;
}

export default function CreatePostFAB({ onClick, label = 'Post Exhibit' }: CreatePostFABProps) {
  return (
    <button 
      onClick={onClick}
      className="hidden md:flex fixed bottom-8 right-8 bg-gradient-to-br from-primary to-primary-container text-on-primary p-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all group items-center gap-2 z-50 overflow-hidden"
    >
      <span className="material-symbols-outlined transition-transform duration-500 group-hover:rotate-12">edit</span>
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold text-sm whitespace-nowrap px-0 group-hover:px-2 opacity-0 group-hover:opacity-100">
        {label}
      </span>
      
      {/* Decorative sweep effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-sweep pointer-events-none"></div>
    </button>
  );
}

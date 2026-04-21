import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full py-12 bg-surface-container-low border-t border-outline-variant/10 font-manrope text-sm">
      <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto">
        <div className="mb-8 md:mb-0 text-center md:text-left">
          <span className="font-bold text-xl block mb-2 text-on-surface">The Gallery</span>
          <p className="text-on-surface-variant/60 italic">© 2024 The Gallery. Curated for the community.</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-8">
          <a className="text-on-surface-variant hover:text-primary transition-all opacity-70 hover:opacity-100" href="#">Privacy</a>
          <a className="text-on-surface-variant hover:text-primary transition-all opacity-70 hover:opacity-100" href="#">Terms</a>
          <a className="text-on-surface-variant hover:text-primary transition-all opacity-70 hover:opacity-100" href="#">Guidelines</a>
          <a className="text-on-surface-variant hover:text-primary transition-all opacity-70 hover:opacity-100" href="#">Contact</a>
        </div>
        
        <div className="flex gap-4 mt-8 md:mt-0">
          <span className="material-symbols-outlined text-on-surface-variant/40 cursor-pointer hover:text-primary transition-all">language</span>
          <span className="material-symbols-outlined text-on-surface-variant/40 cursor-pointer hover:text-primary transition-all">share</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

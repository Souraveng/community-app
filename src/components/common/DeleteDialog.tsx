import React from 'react';

interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Remove Exhibit?", 
  description = "This action will permanently remove this piece from the collection. Curators cannot undo this." 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Dialog Body */}
      <div className="relative bg-surface-container-high/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] transform transition-all animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 rounded-3xl bg-error/10 flex items-center justify-center text-error mb-6">
          <span className="material-symbols-outlined text-4xl">delete_forever</span>
        </div>
        
        <h3 className="text-2xl font-black font-headlines tracking-tighter text-on-surface mb-2">
          {title}
        </h3>
        <p className="text-sm font-body text-on-surface-variant leading-relaxed mb-10 opacity-70">
          {description}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={onConfirm}
            className="flex-1 bg-error text-on-error py-4 rounded-2xl font-black font-headlines text-xs uppercase tracking-widest hover:bg-error/90 active:scale-95 transition-all shadow-lg shadow-error/20"
          >
            Confirm Removal
          </button>
          <button 
            onClick={onClose}
            className="flex-1 bg-white/5 text-on-surface py-4 rounded-2xl font-black font-headlines text-xs uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all border border-white/5"
          >
            Keep Exhibit
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteDialog;

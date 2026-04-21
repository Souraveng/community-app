import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, icon, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-2 w-full text-on-surface">
      {label && <label className="text-sm font-semibold font-headlines">{label}</label>}
      <div className="relative group">
        {icon && (
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
            {icon}
          </span>
        )}
        <input
          className={`w-full bg-surface-container-low border-none rounded-xl py-3 ${
            icon ? 'pl-12' : 'px-4'
          } pr-4 text-sm focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all ${className}`}
          {...props}
        />
      </div>
    </div>
  );
};

export default Input;

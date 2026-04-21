import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className = '', ...props }) => {
  let variantClass = '';
  
  switch (variant) {
    case 'primary':
      variantClass = 'btn-primary';
      break;
    case 'secondary':
      variantClass = 'btn-secondary';
      break;
    case 'outline':
      variantClass = 'border-2 border-outline-variant/30 text-on-surface hover:border-primary/40 hover:bg-surface-container-low px-8 py-3 rounded-2xl transition-all font-bold';
      break;
    case 'ghost':
      variantClass = 'text-primary hover:bg-surface-container-low px-4 py-2 rounded-full transition-all font-bold';
      break;
  }

  return (
    <button className={`${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;

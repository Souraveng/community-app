import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
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
    case 'ghost':
      variantClass = 'text-primary hover:bg-surface-container-low px-4 py-2 rounded-full transition-all';
      break;
  }

  return (
    <button className={`${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;

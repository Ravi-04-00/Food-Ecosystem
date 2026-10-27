import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  icon: Icon,
}) => {
  const base = 'inline-flex items-center justify-center font-sans tracking-luxury uppercase font-semibold transition-all duration-200 select-none btn-physical rounded-full';

  const variants = {
    primary: 'bg-[#D6A85F] text-[#050505] hover:bg-[#F0C982] shadow-lg font-bold',
    secondary: 'bg-[#1C1C21] hover:bg-[#25252D] text-[#F5F5F5] border border-white/15 hover:border-[#D6A85F] backdrop-blur-md',
    gold: 'bg-[#D6A85F] text-[#050505] hover:bg-[#F0C982] shadow-md font-bold',
    ghost: 'text-[#A7A7AE] hover:text-[#F5F5F5] hover:bg-white/5',
  };

  const sizes = {
    sm: 'text-[10px] px-3.5 py-1.5',
    md: 'text-xs px-5 py-2.5',
    lg: 'text-xs px-8 py-3.5',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
    >
      <span>{children}</span>
      {Icon && <Icon className="w-3.5 h-3.5 ml-2 text-[#050505]" />}
    </button>
  );
};

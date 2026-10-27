import React from 'react';

export const Loader = ({ message = 'Loading the ecosystem...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center select-none animate-fadeIn text-[#F5F5F5]">
      {/* WS Monogram */}
      <span className="font-serif tracking-[0.2em] text-xl font-bold text-[#F5F5F5]">
        WS
      </span>
      
      {/* Subtle Rotating Ring with primary gold accent pip */}
      <div className="relative w-8 h-8 my-4">
        <div className="w-full h-full rounded-full border border-white/10 border-t-[#F5F5F5] border-r-[#D6A85F] animate-spin" />
      </div>

      <p className="font-sans text-xs uppercase tracking-[0.2em] text-[#A7A7AE]">
        {message}
      </p>
    </div>
  );
};

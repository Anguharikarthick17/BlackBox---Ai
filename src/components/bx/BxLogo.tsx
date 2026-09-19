import React from 'react';

interface BxLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const BxLogo: React.FC<BxLogoProps> = ({
  size = 'md',
  showSubtitle = false,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base tracking-wider',
    lg: 'text-xl tracking-widest',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Geometric BX Mark */}
      <div className={`relative flex items-center justify-center bg-graphite rounded text-white font-bold ${iconSizes[size]} transition-transform duration-200 hover:scale-105`}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4/5 h-4/5"
        >
          {/* Outer isometric frame */}
          <rect x="2" y="2" width="28" height="28" rx="2" stroke="white" strokeWidth="1.5" strokeOpacity="0.4" />
          {/* B glyph */}
          <path
            d="M8 8H14C16.2 8 17.5 9.2 17.5 11C17.5 12.2 16.8 13.1 15.6 13.5C17.2 14 18.2 15.1 18.2 16.8C18.2 19 16.5 20.5 14 20.5H8V8Z"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* X slash with Crimson Accent */}
          <path d="M19 19L25 25" stroke="#B40023" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M25 19L19 25" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`font-display uppercase font-bold text-graphite leading-none ${textSizes[size]}`}>
            BLACKBOX
          </span>
          <span className={`font-display uppercase font-bold text-accent leading-none ${textSizes[size]}`}>
            X
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[9px] font-mono tracking-[0.25em] text-graphite-400 uppercase mt-0.5">
            QUANT RESEARCH LAB
          </span>
        )}
      </div>
    </div>
  );
};

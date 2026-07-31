'use client';

import React from 'react';

interface LogoProps {
  className?: string;
  height?: number;
}

export function Logo({ className = '', height = 32 }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 text-current ${className}`} style={{ height }}>
      {/* Register grid mark */}
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto shrink-0"
        style={{ height }}
        aria-hidden="true"
      >
        <path
          d="M6 10L16 5L26 10V22L16 27L6 22V10Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M16 5V27M6 16H26"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeOpacity="0.35"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="16" r="3.5" fill="#6366F1" />
      </svg>

      {/* Wordmark */}
      <span
        className="font-bold tracking-tight select-none"
        style={{ fontSize: height * 0.56, letterSpacing: '-0.03em' }}
      >
        INFE
        <span style={{ color: '#6366F1' }}>POS</span>
      </span>
    </div>
  );
}
export default Logo;

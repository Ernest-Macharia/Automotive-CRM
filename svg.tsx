'use client';

import React from 'react';

interface MagLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function MagLogo({ width = 520, height = 160, className = '' }: MagLogoProps) {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 520 160" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="magGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3B82F6"/>
          <stop offset="100%" stopColor="#7C3AED"/>
        </linearGradient>
      </defs>

      {/* Car silhouette */}
      <path
        d="M40 70 C90 50, 170 50, 230 70 L260 80 C270 83, 270 90, 260 93 L240 98 C180 105, 120 105, 60 95 L40 90 C30 87, 30 73, 40 70 Z"
        fill="url(#magGradient)"
      />

      <text
        x="40"
        y="135"
        fontSize="72"
        fontWeight="800"
        letterSpacing="4"
        fill="#FFFFFF"
        fontFamily="Inter, Poppins, Montserrat, Arial, sans-serif"
      >
        VIN17x
      </text>
    </svg>
  );
}
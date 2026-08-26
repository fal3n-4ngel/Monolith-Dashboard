import React from "react";

export function MonolithLogo({ size = 32 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center shrink-0 group cursor-pointer transition-all duration-300"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transform group-hover:scale-105 transition-transform duration-300"
      >
        {/* Monolith Obelisk 3D Faceted Slab */}
        
        {/* Left Facet (Darker Shade) */}
        <polygon
          points="32,6 18,16 18,52 32,58"
          fill="#18181B"
        />

        {/* Right Facet (Lighter Shadow/Highlight) */}
        <polygon
          points="32,6 46,16 46,52 32,58"
          fill="#27272A"
        />

        {/* Top Apex Highlight Edge */}
        <polygon
          points="32,6 18,16 32,20 46,16"
          fill="#3F3F46"
        />

        {/* Glowing Orange Center Seam / Laser Core */}
        <line
          x1="32"
          y1="6"
          x2="32"
          y2="58"
          stroke="#FF5C38"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Subtle Top Glow Pulse Dot */}
        <circle cx="32" cy="6" r="3" fill="#FF5C38" />
      </svg>
    </div>
  );
}

export function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.1 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.7 34.9 27 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.3 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.4l6.6 5.6C41.7 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}

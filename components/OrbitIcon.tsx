'use client';

import { useState, type ReactNode } from 'react';

interface OrbitIconProps {
  /** Path to the image, e.g. "/icons/top-icon.png" */
  src: string;
  alt?: string;
  /** Tailwind classes applied to the <img> tag */
  className?: string;
  /** Tailwind classes for the fallback <div> shown when image fails */
  fallbackClassName?: string;
  /** Content (emoji, text, or Lucide icon) inside the fallback div */
  fallbackContent?: ReactNode;
}

/**
 * Renders an <img> with the given src.
 * If the image fails to load (file missing / network error), it automatically
 * swaps to a fallback div — identical to the original design so the UI never
 * shows a broken image placeholder.
 */
// App_icon2-style inline SVG fallback — green circle with M + orbit dots
function OrbitIconFallback({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="20" cy="20" r="20" fill="#16A34A"/>
      <circle cx="20" cy="20" r="13" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" fill="none"/>
      <circle cx="20" cy="7" r="2.5" fill="white"/>
      <circle cx="33" cy="20" r="2.5" fill="white"/>
      <circle cx="20" cy="33" r="2.5" fill="white"/>
      <circle cx="7" cy="20" r="2.5" fill="white"/>
      <text x="20" y="26" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="16" fill="white">M</text>
    </svg>
  );
}

export default function OrbitIcon({
  src,
  alt = 'MyOrbit',
  className = 'h-7 w-7 flex-none rounded-full object-cover',
  fallbackClassName = 'h-7 w-7 flex-none rounded-full',
  fallbackContent,
}: OrbitIconProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    if (fallbackContent) {
      return <div className={fallbackClassName}>{fallbackContent}</div>;
    }
    return <OrbitIconFallback className={fallbackClassName} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

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
export default function OrbitIcon({
  src,
  alt = 'MyOrbit',
  className = 'h-7 w-7 flex-none rounded-lg object-cover shadow-sm',
  fallbackClassName = 'flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 text-white text-sm font-bold leading-none shadow-sm',
  fallbackContent = '⭑',
}: OrbitIconProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <div className={fallbackClassName}>{fallbackContent}</div>;
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

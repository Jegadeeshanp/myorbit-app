'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

interface Props {
  href?: string;
  onClick?: () => void;
  className?: string;
}

const baseClassName =
  'fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_18px_40px_rgba(16,185,129,0.35)] transition hover:bg-emerald-500';

export default function CreateTaskFab({ href, onClick, className }: Props) {
  const mergedClassName = className ? `${baseClassName} ${className}` : baseClassName;

  if (href) {
    return (
      <Link href={href} className={mergedClassName} aria-label="Create task">
        <Plus className="h-5 w-5" />
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={mergedClassName} aria-label="Create task">
      <Plus className="h-5 w-5" />
    </button>
  );
}

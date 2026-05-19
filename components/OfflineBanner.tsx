'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const onOnline  = () => setOffline(false);
    const onOffline = () => setOffline(true);
    // Check current state on mount
    setOffline(!navigator.onLine);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 bg-gray-800 px-4 py-2 text-sm text-white shadow-lg">
      <WifiOff className="h-4 w-4 flex-none text-gray-300" />
      <span>You're offline — changes will sync when you're back</span>
    </div>
  );
}

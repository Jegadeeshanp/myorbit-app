'use client';

/**
 * ForceLightMode
 * Drop this into any page that must always render with the light theme,
 * regardless of the user's OS preference or in-app theme setting.
 *
 * On mount  → removes 'dark' from <html>, resets body background
 * On unmount → restores the previous state so the rest of the app is unaffected
 */
import { useEffect } from 'react';

export default function ForceLightMode() {
  useEffect(() => {
    const html  = document.documentElement;
    const body  = document.body;

    const hadDark         = html.classList.contains('dark');
    const prevBodyBg      = body.style.backgroundColor;
    const prevBodyColor   = body.style.color;
    const prevColorScheme = html.style.colorScheme;

    // Force light
    html.classList.remove('dark');
    html.style.colorScheme    = 'light';
    body.style.backgroundColor = '#F7F7F5';
    body.style.color           = '#111827';

    return () => {
      // Restore original state when navigating away
      if (hadDark) html.classList.add('dark');
      html.style.colorScheme    = prevColorScheme;
      body.style.backgroundColor = prevBodyBg;
      body.style.color           = prevBodyColor;
    };
  }, []);

  return null;
}

import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
// Geist is imported from the vendored npm package — no network fetch at build time
import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/lib/authStore';
import { ThemeProvider } from '@/lib/themeStore';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import NotificationListener from "@/components/NotificationListener";
import './globals.css';

export const metadata: Metadata = {
  title: 'MyOrbit — Your life, one orbit',
  description: 'Track your finances, goals, health, habits and tasks in one beautiful dashboard.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'MyOrbit' },
  formatDetection: { telephone: false },
  icons: { icon: '/icons/app-logo.png', apple: '/icons/app-logo.png' },
};

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t===null||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MyOrbit" />
        <link rel="apple-touch-icon" href="/icons/app-logo.png" />
      </head>

      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <SessionProvider>
          <AuthProvider>
            <ThemeProvider>
              <NotificationListener /> {/* ✅ ADD HERE */}
              {children}
            </ThemeProvider>
          </AuthProvider>
        </SessionProvider>

        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
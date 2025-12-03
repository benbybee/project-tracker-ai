import type { Metadata } from 'next';
import './globals.css';
import PWAInit from '@/components/system/PWAInit';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { Providers } from './providers';
import { validateEnv } from '@/lib/env';
import { Toaster } from '@/components/ui/toaster';

// Validate environment variables at runtime (server-side only)
// Skip during build phase to allow deployment with env vars set in platform
if (typeof window === 'undefined' && process.env.VERCEL !== '1') {
  try {
    validateEnv();
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    if (process.env.NODE_ENV === 'production') {
      // Only fail if not in build phase
      if (process.env.NEXT_PHASE !== 'phase-production-build') {
        throw error; // Fail fast in production runtime
      }
    }
  }
}

export const metadata: Metadata = {
  title: 'TaskTracker AI',
  description: 'AI-powered task and project management',
  themeColor: '#6D4AFF',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      {
        url: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-120x120.png', sizes: '120x120', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TaskTracker AI',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
  },
};

// Force dynamic rendering to avoid tRPC issues during build
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#6D4AFF" />
        {/* iOS PWA Meta Tags - Required for standalone mode */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="TaskTracker AI" />
        {/* Apple Touch Icon - iOS requires this for home screen icon */}
        {/* iOS automatically looks for /apple-touch-icon.png in root, but we also specify it explicitly */}
        <link
          rel="apple-touch-icon"
          href="/apple-touch-icon.png"
          sizes="180x180"
        />
        <link
          rel="apple-touch-icon"
          href="/icons/apple-touch-icon.png"
          sizes="180x180"
        />
        {/* Additional sizes for better compatibility */}
        <link
          rel="apple-touch-icon"
          href="/icons/icon-152x152.png"
          sizes="152x152"
        />
        <link
          rel="apple-touch-icon"
          href="/icons/icon-120x120.png"
          sizes="120x120"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-2048-2732.png"
          sizes="2048x2732"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-1668-2388.png"
          sizes="1668x2388"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-1536-2048.png"
          sizes="1536x2048"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-1125-2436.png"
          sizes="1125x2436"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-1242-2688.png"
          sizes="1242x2688"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-828-1792.png"
          sizes="828x1792"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-1242-2208.png"
          sizes="1242x2208"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-750-1334.png"
          sizes="750x1334"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-640-1136.png"
          sizes="640x1136"
        />
      </head>
      <body>
        <Providers>
          <NotificationProvider>
            {/* Ensure SW is registered on the client for static asset caching */}
            <PWAInit />
            {children}
            <Toaster />
          </NotificationProvider>
        </Providers>
      </body>
    </html>
  );
}

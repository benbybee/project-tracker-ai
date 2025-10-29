import type { Metadata } from 'next';
import './globals.css';
import PWAInit from '@/components/system/PWAInit';
import ClearStorageInit from '@/components/system/ClearStorageInit';
import SyncBootstrap from '@/components/sync/SyncBootstrap';
import ConflictModal from '@/components/sync/ConflictModal';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { Providers } from './providers';
import { validateEnv } from '@/lib/env';

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
  description: 'PWA task tracker with offline sync',
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
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TaskTracker AI',
    startupImage: [
      {
        url: '/icons/icon-512x512.png',
        media:
          '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)',
      },
    ],
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
      <body>
        <Providers>
          <NotificationProvider>
            {/* Ensure SW is registered on the client with **no toasts** */}
            <PWAInit />
            <ClearStorageInit />
            <SyncBootstrap />
            {children}
            {/* Global conflict resolution modal */}
            <ConflictModal />
          </NotificationProvider>
        </Providers>
      </body>
    </html>
  );
}

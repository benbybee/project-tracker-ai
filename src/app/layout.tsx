import type { Metadata } from 'next';
import './globals.css';
import PWAInit from '@/components/system/PWAInit';
import SyncBootstrap from '@/components/sync/SyncBootstrap';
import ConflictModal from '@/components/sync/ConflictModal';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { Providers } from './providers';
import { validateEnv } from '@/lib/env';

// Validate environment variables at startup (server-side only)
if (typeof window === 'undefined') {
  try {
    validateEnv();
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error; // Fail fast in production
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

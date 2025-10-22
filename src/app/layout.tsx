import type { Metadata } from 'next';
import './globals.css';
import PWAInit from '@/components/system/PWAInit';
import SyncBootstrap from '@/components/sync/SyncBootstrap';
import ConflictModal from '@/components/sync/ConflictModal';

export const metadata: Metadata = {
  title: 'TaskTracker AI',
  description: 'PWA task tracker with offline sync',
};

// Force dynamic rendering to avoid tRPC issues during build
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Ensure SW is registered on the client with **no toasts** */}
        <PWAInit />
        <SyncBootstrap />
        {children}
        {/* Global conflict resolution modal */}
        <ConflictModal />
      </body>
    </html>
  );
}

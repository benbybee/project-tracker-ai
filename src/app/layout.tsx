// Root layout should ONLY load global CSS and render children.
// Do NOT put AppLayout or CommandPalette here.
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { PWAProvider } from './pwa-provider';
import { SyncProvider } from './sync-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TaskTracker AI',
  description: 'AI-powered task management with intelligent organization',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TaskTracker AI',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#6D4AFF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <PWAProvider>
            <SyncProvider>
              {children}
            </SyncProvider>
          </PWAProvider>
        </Providers>
      </body>
    </html>
  );
}

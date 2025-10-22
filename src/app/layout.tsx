import type { Metadata } from 'next';
import './globals.css';
import PWAInit from '@/components/system/PWAInit';

export const metadata: Metadata = {
  title: 'TaskTracker AI',
  description: 'PWA task tracker with offline sync',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Ensure SW is registered on the client with **no toasts** */}
        <PWAInit />
        {children}
      </body>
    </html>
  );
}

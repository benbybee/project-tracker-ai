'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { httpBatchLink } from '@trpc/client';
import { useState, ReactNode } from 'react';
// @ts-ignore
import superjson from 'superjson';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsModal } from '@/components/ui/keyboard-shortcuts-modal';

// Keyboard Shortcuts Provider
function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
  const { helpModalOpen, setHelpModalOpen } = useKeyboardShortcuts();

  return (
    <>
      {children}
      <KeyboardShortcutsModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />
    </>
  );
}

// Stub implementation of useRealtime hook
// This is a placeholder until real-time functionality is implemented
export function useRealtime() {
  return {
    onNotification: () => () => {},
    broadcastNotification: () => {},
    onChatMessage: () => () => {},
    broadcastChatMessage: () => {},
    onActivity: () => () => {},
    broadcastActivity: () => {},
    startTyping: () => {},
    stopTyping: () => {},
    updatePresence: () => {},
    onlineUsers: [],
    isConnected: false,
    broadcastChatTyping: () => {},
    onChatTyping: () => () => {},
  };
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Keep data fresh for 30 seconds - balanced approach
            staleTime: 30 * 1000,
            // Cache data for 10 minutes for offline resilience
            cacheTime: 10 * 60 * 1000,
            // Retry once on failure
            retry: 1,
            // Refetch on window focus to ensure fresh data
            refetchOnWindowFocus: 'always',
            // Refetch on mount to ensure fresh data
            refetchOnMount: 'always',
            // Don't refetch on reconnect to avoid unnecessary requests
            refetchOnReconnect: false,
          },
        },
      })
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: '/api/trpc',
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <KeyboardShortcutsProvider>{children}</KeyboardShortcutsProvider>
        </SessionProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

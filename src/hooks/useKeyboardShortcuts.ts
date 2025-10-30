'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isInputElement, isMacOS } from '@/lib/keyboard-utils';

/**
 * Global keyboard shortcuts hook
 * Handles both global shortcuts and vim-style navigation
 */
export function useKeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const [vimPrefix, setVimPrefix] = useState<string | null>(null);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as Element;

      // Don't trigger shortcuts when typing in input fields
      if (isInputElement(target)) {
        // Except for Escape to blur
        if (event.key === 'Escape') {
          (target as HTMLElement).blur();
        }
        return;
      }

      const isMac = isMacOS();
      const modKey = isMac ? event.metaKey : event.ctrlKey;

      // Handle vim-style navigation (G then X)
      if (vimPrefix === 'g') {
        event.preventDefault();
        switch (event.key.toLowerCase()) {
          case 'd':
            router.push('/dashboard');
            break;
          case 'b':
            router.push('/board');
            break;
          case 'p':
            router.push('/projects');
            break;
          case 'c':
            router.push('/daily'); // 'c' for calendar/daily
            break;
          case 't':
            router.push('/tickets');
            break;
          case 's':
            router.push('/settings');
            break;
          case 'n':
            router.push('/notes');
            break;
        }
        setVimPrefix(null);
        return;
      }

      // Set vim prefix
      if (
        event.key.toLowerCase() === 'g' &&
        !modKey &&
        !event.shiftKey &&
        !event.altKey
      ) {
        event.preventDefault();
        setVimPrefix('g');
        // Clear prefix after 1 second
        setTimeout(() => setVimPrefix(null), 1000);
        return;
      }

      // Global shortcuts with Ctrl/Cmd
      if (modKey) {
        switch (event.key.toLowerCase()) {
          case 'k':
            event.preventDefault();
            // Trigger command palette (existing functionality)
            document.dispatchEvent(
              new KeyboardEvent('keydown', {
                key: 'k',
                ctrlKey: !isMac,
                metaKey: isMac,
                bubbles: true,
              })
            );
            break;

          case 'n':
            if (!event.shiftKey) {
              event.preventDefault();
              // Open quick create task modal
              window.dispatchEvent(new CustomEvent('openQuickTaskModal'));
            } else {
              // Ctrl+Shift+N - Quick create project
              event.preventDefault();
              window.dispatchEvent(new CustomEvent('openQuickProjectModal'));
            }
            break;

          case ',':
            event.preventDefault();
            router.push('/settings');
            break;

          case 'b':
            event.preventDefault();
            // Toggle sidebar
            window.dispatchEvent(new CustomEvent('toggleSidebar'));
            break;

          case '/':
            event.preventDefault();
            setHelpModalOpen(true);
            break;
        }
      }

      // Escape key - Close modals/cancel operations
      if (event.key === 'Escape') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('closeAllModals'));
        setVimPrefix(null);
      }
    },
    [router, vimPrefix]
  );

  // Clear vim prefix when route changes
  useEffect(() => {
    setVimPrefix(null);
  }, [pathname]);

  // Attach keyboard listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    vimPrefix,
    helpModalOpen,
    setHelpModalOpen,
  };
}

/**
 * Hook for context-specific shortcuts (within a component)
 * @example useContextShortcuts({ 'e': () => openEditModal() })
 */
export function useContextShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as Element;

      // Don't trigger when typing in input fields
      if (isInputElement(target)) return;

      // Don't trigger if any modifiers are pressed
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const key = event.key.toLowerCase();
      if (shortcuts[key]) {
        event.preventDefault();
        shortcuts[key]();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}

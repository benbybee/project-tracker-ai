'use client';

import { useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function registerServiceWorker() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return;
  }

  // Only register in production
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  // NOTE: Commented out to fix React Hook rule violation
  // useEffect(() => {
  //   let deferredPrompt: BeforeInstallPromptEvent | null = null;

  //   // Handle beforeinstallprompt event
  //   const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
  //     // Prevent the mini-infobar from appearing on mobile
  //     e.preventDefault();
  //     // Stash the event so it can be triggered later
  //     deferredPrompt = e;

  //     // Show install prompt
  //     showInstallPrompt();
  //   };

  //   // Handle appinstalled event
  //   const handleAppInstalled = () => {
  //     // PWA was installed
  //     showToast('App installed successfully', 'success');
  //     deferredPrompt = null;
  //   };

  //   // Handle service worker registration
  //   const registerSW = async () => {
  //     if ('serviceWorker' in navigator) {
  //       try {
  //         const registration = await navigator.serviceWorker.register(
  //           '/service-worker-simple.js'
  //         );

  //         // Service worker registered successfully

  //         // Handle updates
  //         registration.addEventListener('updatefound', () => {
  //           const newWorker = registration.installing;
  //           if (newWorker) {
  //             newWorker.addEventListener('statechange', () => {
  //               if (
  //                 newWorker.state === 'installed' &&
  //                 navigator.serviceWorker.controller
  //               ) {
  //                 // New content is available, reload the page
  //                 window.location.reload();
  //               }
  //             });
  //           }
  //         });
  //       } catch (error) {
  //         // Service worker registration failed silently
  //         // User experience is not affected
  //       }
  //     }
  //   };

  //   // Show install prompt
  //   const showInstallPrompt = () => {
  //     if (deferredPrompt) {
  //       deferredPrompt.prompt();
  //       deferredPrompt.userChoice.then((_choiceResult) => {
  //         // User has made their choice about installing the PWA
  //         deferredPrompt = null;
  //       });
  //     }
  //   };

  //   // Show toast notification
  //   const showToast = (message: string, type: 'success' | 'info' | 'error') => {
  //     // Create toast element
  //     const toast = document.createElement('div');
  //     toast.className = `fixed bottom-4 left-4 z-50 max-w-sm w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-in-out ${
  //       type === 'success'
  //         ? 'border-green-200 bg-green-50'
  //         : type === 'error'
  //           ? 'border-red-200 bg-red-50'
  //           : 'border-blue-200 bg-blue-50'
  //     }`;

  //     toast.innerHTML = `
  //       <div class="flex items-center">
  //         <div class="flex-shrink-0">
  //           ${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚙️'}
  //         </div>
  //         <div class="ml-3">
  //           <p class="text-sm font-medium text-gray-900 dark:text-gray-100">${message}</p>
  //         </div>
  //         <div class="ml-auto pl-3">
  //           <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
  //             <span class="sr-only">Close</span>
  //             <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
  //               <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
  //             </svg>
  //           </button>
  //         </div>
  //       </div>
  //     `;

  //     document.body.appendChild(toast);

  //     // Auto remove after 5 seconds
  //     setTimeout(() => {
  //       if (toast.parentElement) {
  //         toast.remove();
  //       }
  //     }, 5000);
  //   };

  //   // Register event listeners
  //   window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  //   window.addEventListener('appinstalled', handleAppInstalled);

  //   // Register service worker
  //   registerSW();

  //   // Cleanup
  //   return () => {
  //     window.removeEventListener(
  //       'beforeinstallprompt',
  //       handleBeforeInstallPrompt
  //     );
  //     window.removeEventListener('appinstalled', handleAppInstalled);
  //   };
  // }, []);
}

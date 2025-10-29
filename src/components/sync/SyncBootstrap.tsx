'use client';
import { useEffect } from 'react';
import {
  wireServiceWorkerMessages,
  startFallbackInterval,
} from '@/lib/sync-manager';

export default function SyncBootstrap() {
  useEffect(() => {
    wireServiceWorkerMessages();
    // If SyncManager isn't available, we still poll quietly
    startFallbackInterval(30000);
  }, []);
  return null;
}

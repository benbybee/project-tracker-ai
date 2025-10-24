'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getWebSocketClient, RealtimeConnectionStatus, RealtimeEvent } from '@/lib/ws-client';

export function useRealtimeConnection() {
  const { data: session } = useSession();
  const [status, setStatus] = useState<RealtimeConnectionStatus>('disconnected');
  const [wsClient, setWsClient] = useState<any>(null);

  useEffect(() => {
    if (!session?.user) return;

    const client = getWebSocketClient();
    setWsClient(client);

    const handleStatusChange = (newStatus: RealtimeConnectionStatus) => {
      setStatus(newStatus);
    };

    const unsubscribe = client.on('status', handleStatusChange);

    // Connect if not already connected
    if (!client.isConnected()) {
      client.connect();
    }

    return () => {
      unsubscribe();
    };
  }, [session]);

  const connect = useCallback(() => {
    if (wsClient) {
      wsClient.connect();
    }
  }, [wsClient]);

  const disconnect = useCallback(() => {
    if (wsClient) {
      wsClient.disconnect();
    }
  }, [wsClient]);

  return {
    status,
    isConnected: status === 'connected',
    connect,
    disconnect,
    wsClient
  };
}

export function useRealtimeEvents() {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const { wsClient } = useRealtimeConnection();

  useEffect(() => {
    if (!wsClient) return;

    const handleMessage = (event: RealtimeEvent) => {
      setEvents(prev => [...prev.slice(-99), event]); // Keep last 100 events
    };

    const unsubscribe = wsClient.on('message', handleMessage);

    return unsubscribe;
  }, [wsClient]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    events,
    clearEvents
  };
}

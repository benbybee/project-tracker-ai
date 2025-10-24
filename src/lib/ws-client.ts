'use client';

export type RealtimeEvent = {
  type: 'task_updated' | 'project_updated' | 'user_presence' | 'user_typing' | 'conflict_detected';
  entity: 'task' | 'project' | 'user';
  action: 'create' | 'update' | 'delete' | 'presence' | 'typing';
  data: any;
  version: number;
  userId: string;
  timestamp: number;
};

export type PresenceData = {
  userId: string;
  userName: string;
  userEmail: string;
  isOnline: boolean;
  lastActiveAt: number;
  currentProject?: string;
  currentTask?: string;
  isEditing?: boolean;
};

export type RealtimeConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private status: RealtimeConnectionStatus = 'disconnected';
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private session: any = null;

  constructor() {
    if (typeof window === 'undefined') return;
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/api/realtime/connect`;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.setStatus('connecting');
    
    try {
      const wsUrl = this.getWebSocketUrl();
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.setStatus('connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.setStatus('disconnected');
        this.stopHeartbeat();
        this.emit('disconnected', { code: event.code, reason: event.reason });
        
        if (event.code !== 1000) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.setStatus('error');
        this.emit('error', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.setStatus('error');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.stopHeartbeat();
    this.setStatus('disconnected');
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.setStatus('error');
      return;
    }

    this.setStatus('reconnecting');
    this.reconnectAttempts++;
    
    setTimeout(() => {
      console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
      this.connect();
    }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1));
  }

  private startHeartbeat(): void {
    const interval = parseInt(process.env.NEXT_PUBLIC_WS_HEARTBEAT_INTERVAL || '15000');
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'heartbeat',
          timestamp: Date.now(),
          userId: this.session?.user?.id
        });
      }
    }, interval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleMessage(data: RealtimeEvent): void {
    this.emit(data.type, data);
    this.emit('message', data);
  }

  send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  private setStatus(status: RealtimeConnectionStatus): void {
    this.status = status;
    this.emit('status', status);
  }

  getStatus(): RealtimeConnectionStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  updatePresence(data: Partial<PresenceData>): void {
    this.send({
      type: 'user_presence',
      entity: 'user',
      action: 'presence',
      data: {
        userId: this.session?.user?.id,
        userName: this.session?.user?.name,
        userEmail: this.session?.user?.email,
        timestamp: Date.now(),
        ...data
      },
      version: 1,
      userId: this.session?.user?.id,
      timestamp: Date.now()
    });
  }

  startTyping(entityType: 'task' | 'project', entityId: string): void {
    this.send({
      type: 'user_typing',
      entity: entityType,
      action: 'typing',
      data: {
        entityId,
        isTyping: true,
        timestamp: Date.now()
      },
      version: 1,
      userId: this.session?.user?.id,
      timestamp: Date.now()
    });
  }

  stopTyping(entityType: 'task' | 'project', entityId: string): void {
    this.send({
      type: 'user_typing',
      entity: entityType,
      action: 'typing',
      data: {
        entityId,
        isTyping: false,
        timestamp: Date.now()
      },
      version: 1,
      userId: this.session?.user?.id,
      timestamp: Date.now()
    });
  }

  broadcastUpdate(entityType: 'task' | 'project', entityId: string, data: any): void {
    this.send({
      type: `${entityType}_updated`,
      entity: entityType,
      action: 'update',
      data: {
        id: entityId,
        ...data,
        timestamp: Date.now()
      },
      version: 1,
      userId: this.session?.user?.id,
      timestamp: Date.now()
    });
  }
}

let wsClient: WebSocketClient | null = null;

export function getWebSocketClient(): WebSocketClient {
  if (!wsClient) {
    wsClient = new WebSocketClient();
  }
  return wsClient;
}

export function connectWebSocket(): WebSocketClient {
  const client = getWebSocketClient();
  client.connect();
  return client;
}

export function disconnectWebSocket(): void {
  if (wsClient) {
    wsClient.disconnect();
  }
}

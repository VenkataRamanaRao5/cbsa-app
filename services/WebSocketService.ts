/**
 * WebSocket Service for CBSA Backend
 * Handles persistent connection for streaming behavioral data
 */

import { BACKEND_CONFIG } from '@/config/backend';
import { configService } from './ConfigService';

let WS_URL = BACKEND_CONFIG.WS_URL; // Default fallback
const RECONNECT_DELAY_MS = BACKEND_CONFIG.WS_RECONNECT_DELAY_MS;
const MAX_RECONNECT_ATTEMPTS = BACKEND_CONFIG.WS_MAX_RECONNECT_ATTEMPTS;
const MESSAGE_QUEUE_SIZE = BACKEND_CONFIG.WS_MESSAGE_QUEUE_SIZE;
const CONNECTION_TIMEOUT_MS = BACKEND_CONFIG.WS_CONNECTION_TIMEOUT_MS;

type MessageCallback = (data: any) => void;
type ConnectionCallback = (connected: boolean) => void;
type EnrollmentCallback = (data: { status: string; message: string; user_id: string }) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private messageQueue: any[] = [];
  private isConnecting = false;
  
  private userId: string | null = null;
  private sessionId: string | null = null;
  private messageId = 0;

  private onMessageCallback: MessageCallback | null = null;
  private onConnectionChangeCallback: ConnectionCallback | null = null;
  private onEnrollmentCallback: EnrollmentCallback | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeURL();
  }

  /**
   * Initialize URL from config service
   */
  private async initializeURL() {
    try {
      WS_URL = await configService.getWebSocketURL();
      console.log('[WebSocket] URL initialized:', WS_URL);
    } catch (error) {
      console.error('[WebSocket] Failed to initialize URL:', error);
    }
  }

  /**
   * Update WebSocket URL (called after user sets config)
   */
  async updateURL(): Promise<void> {
    WS_URL = await configService.getWebSocketURL();
    console.log('[WebSocket] URL updated:', WS_URL);
    
    // If already connected, disconnect so next connect uses new URL
    if (this.isConnected()) {
      this.disconnect();
    }
  }

  /**
   * Set user ID for all messages
   */
  setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * Set callback for incoming messages
   */
  onMessage(callback: MessageCallback) {
    this.onMessageCallback = callback;
  }

  /**
   * Set callback for connection status changes
   */
  onConnectionChange(callback: ConnectionCallback) {
    this.onConnectionChangeCallback = callback;
  }

  /**
   * Set callback for enrollment status messages from server
   */
  onEnrollmentStatus(callback: EnrollmentCallback) {
    this.onEnrollmentCallback = callback;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        resolve();
        return;
      }

      this.isConnecting = true;
      console.log('[WebSocket] Connecting to', WS_URL);

      try {
        this.ws = new WebSocket(WS_URL);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.onConnectionChangeCallback?.(true);
          this.flushMessageQueue();
          resolve();
        };

        this.ws.onclose = (event) => {
          console.log('[WebSocket] Disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.onConnectionChangeCallback?.(false);
          this.scheduleReconnect();
        };

        this.ws.onerror = (error: any) => {
          const errorMsg = error?.message || 'Connection failed';
          console.error('[WebSocket] Error:', {
            message: errorMsg,
            url: WS_URL,
            readyState: this.ws?.readyState
          });
          this.isConnecting = false;
          // Don't reject - let onclose handle reconnection
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[WebSocket] Received:', data);

            // Intercept enrollment status messages
            if (data?.type === 'enrollment_status') {
              this.onEnrollmentCallback?.(data);
              return;
            }

            this.onMessageCallback?.(data);
          } catch (e) {
            console.error('[WebSocket] Failed to parse message:', e);
          }
        };

        // Timeout for initial connection
        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false;
            reject(new Error('Connection timeout'));
          }
        }, CONNECTION_TIMEOUT_MS);

      } catch (error: any) {
        this.isConnecting = false;
        const errorMsg = error?.message || 'Failed to create WebSocket connection';
        console.error('[WebSocket] Connection error:', {
          error: errorMsg,
          url: WS_URL
        });
        reject(new Error(`WebSocket connection failed: ${errorMsg}`));
      }
    });
  }

  /**
   * Send behavioral event data
   */
  sendBehavioralEvent(eventType: string, eventData: any): boolean {
    const message = {
      user_id: this.userId,
      session_id: this.sessionId,
      timestamp: Date.now() / 1000, // Unix timestamp in seconds
      event_type: eventType,
      event_data: eventData,
    };

    return this.send(message);
  }

  /**
   * Send raw message
   */
  send(data: any): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
        this.messageId++;
        return true;
      } catch (error) {
        console.error('[WebSocket] Send error:', error);
        this.queueMessage(data);
        return false;
      }
    } else {
      // Queue message for when connection is restored
      this.queueMessage(data);
      // Try to connect if not already
      if (!this.isConnecting && this.ws?.readyState !== WebSocket.CONNECTING) {
        this.connect().catch(() => {});
      }
      return false;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnection
      this.ws.close();
      this.ws = null;
    }

    console.log('[WebSocket] Disconnected manually');
    this.onConnectionChangeCallback?.(false);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId || '';
  }

  // ───── Private Methods ─────

  private queueMessage(data: any) {
    // Limit queue size to prevent memory issues
    if (this.messageQueue.length < MESSAGE_QUEUE_SIZE) {
      this.messageQueue.push(data);
      console.log('[WebSocket] Message queued, queue size:', this.messageQueue.length);
    } else {
      console.warn('[WebSocket] Message queue full, dropping oldest message');
      this.messageQueue.shift();
      this.messageQueue.push(data);
    }
  }

  private flushMessageQueue() {
    if (this.messageQueue.length > 0) {
      console.log('[WebSocket] Flushing', this.messageQueue.length, 'queued messages');
      
      while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
        const message = this.messageQueue.shift();
        try {
          this.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('[WebSocket] Failed to flush message:', error);
          // Put it back at the front
          this.messageQueue.unshift(message);
          break;
        }
      }
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[WebSocket] Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimer) {
      return; // Already scheduled
    }

    this.reconnectAttempts++;
    const delay = RECONNECT_DELAY_MS * Math.min(this.reconnectAttempts, 5);
    
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch((error) => {
        console.error('[WebSocket] Reconnection failed:', error);
      });
    }, delay);
  }

  private generateSessionId(): string {
    return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
  }
}

// Singleton instance
export const wsService = new WebSocketService();

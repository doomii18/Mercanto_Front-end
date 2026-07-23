import type { ApiClient } from "../../client";
import { BaseEventSchema, WsTicketResponseSchema } from "./payloads";
import type { NotificationCallback, NotificationEvent } from "./types";

export class NotificationsService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isIntentionalDisconnect = false;

  private catchAllCallbacks: Set<NotificationCallback> = new Set();
  private eventCallbacks: Map<string, Set<NotificationCallback>> = new Map();

  constructor(private readonly client: ApiClient) {}

  subscribeAll(callback: NotificationCallback): () => void {
    this.catchAllCallbacks.add(callback);
    return () => this.catchAllCallbacks.delete(callback);
  }

  subscribe(eventType: string, callback: NotificationCallback): () => void {
    if (!this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.set(eventType, new Set());
    }
    this.eventCallbacks.get(eventType)!.add(callback);
    return () => this.eventCallbacks.get(eventType)!.delete(callback);
  }

  async connect(): Promise<void> {
    this.isIntentionalDisconnect = false;
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      const data = await this.client.request("/notifications/ticket", { method: "POST" });
      const { ticket } = WsTicketResponseSchema.parse(data);

      const wsUrl = new URL(this.client.getBaseUrl());
      wsUrl.protocol = wsUrl.protocol === "https:" ? "wss:" : "ws:";
      wsUrl.pathname = "/notifications";
      wsUrl.searchParams.append("token", ticket);

      this.ws = new WebSocket(wsUrl.toString());
      this.setupWsHandlers();
    } catch (error) {
      this.handleReconnect();
    }
  }

  disconnect(): void {
    this.isIntentionalDisconnect = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private setupWsHandlers(): void {
      if (!this.ws) return;

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (message: MessageEvent) => {
        try {
          const rawPayload = JSON.parse(message.data);
          const event = BaseEventSchema.parse(rawPayload);
          this.dispatchEvent(event);
        } catch (e) {
          console.error("Dropped unroutable or malformed WS payload", e);
        }
      };

      this.ws.onclose = () => {
        if (!this.isIntentionalDisconnect) this.handleReconnect();
      };
    }

  private dispatchEvent(event: NotificationEvent): void {
    this.catchAllCallbacks.forEach((cb) => cb(event));

    if (event.type && this.eventCallbacks.has(event.type)) {
      this.eventCallbacks.get(event.type)!.forEach((cb) => cb(event));
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    this.reconnectAttempts++;
    const backoffMs = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);

    setTimeout(() => this.connect(), backoffMs);
  }
}

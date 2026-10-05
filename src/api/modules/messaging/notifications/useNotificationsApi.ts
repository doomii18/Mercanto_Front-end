import { ref, shallowRef, watch } from "vue";
import { useEventSource } from "@vueuse/core";
import { useApiFetch } from "@/api/useApiFetch";
import {
  NotificationEventSchema,
  WsTicketResponseSchema,
  PaginatedNotificationsResponseSchema,
  UnreadNotificationCountSchema,
} from "./responses";
import {
  MarkNotificationsReadSchema,
  NotificationHistoryQuerySchema,
} from "./requests";
import type {
  NotificationEvent,
  WsTicketResponse,
  PaginatedNotificationsResponse,
  UnreadNotificationCount,
  MarkNotificationsRead,
  NotificationHistoryQuery,
} from "./types";

export const useNotificationsApi = () => {
  // POST /notifications/ticket
  async function generateTicket(): Promise<WsTicketResponse> {
    const { data, error } = await useApiFetch("/notifications/ticket")
      .post()
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to generate notification ticket");
    }
    return WsTicketResponseSchema.parse(data.value);
  }

  // GET /notifications/history
  async function getNotificationHistory(
    params?: NotificationHistoryQuery
  ): Promise<PaginatedNotificationsResponse> {
    const validated = params ? NotificationHistoryQuerySchema.parse(params) : undefined;
    const queryParams = new URLSearchParams();
    if (validated?.limit !== undefined) queryParams.append("limit", validated.limit.toString());
    if (validated?.offset !== undefined) queryParams.append("offset", validated.offset.toString());
    if (validated?.is_read !== undefined) queryParams.append("is_read", validated.is_read.toString());

    const qs = queryParams.toString();
    const endpoint = `/notifications/history${qs ? `?${qs}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch notification history");
    }

    return PaginatedNotificationsResponseSchema.parse(data.value);
  }

  // PATCH /notifications/read
  async function markNotificationsRead(payload: MarkNotificationsRead): Promise<void> {
    const validated = MarkNotificationsReadSchema.parse(payload);
    const { error } = await useApiFetch("/notifications/read")
      .patch(validated);

    if (error.value) {
      throw error.value || new Error("Failed to mark notifications as read");
    }
  }

  // GET /notifications/unread-count
  async function getUnreadCount(): Promise<UnreadNotificationCount> {
    const { data, error } = await useApiFetch("/notifications/unread-count")
      .get()
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch unread notification count");
    }

    return UnreadNotificationCountSchema.parse(data.value);
  }

  // Helper to build SSE stream URL
  function getNotificationStreamUrl(ticket: string, baseUrl?: string): string {
    const host = baseUrl || import.meta.env.VITE_API_BASE_URL || window.location.origin;
    const url = new URL(host);
    url.pathname = "/notifications";
    url.searchParams.set("token", ticket);
    return url.toString();
  }

  return {
    generateTicket,
    getNotificationHistory,
    markNotificationsRead,
    getUnreadCount,
    getNotificationStreamUrl,
  };
};

/**
 * Encapsulates the SSE connection lifecycle and ticket exchange.
 */
export function useNotificationEventSource() {
  const notificationsApi = useNotificationsApi();
  const url = ref<string | undefined>(undefined);

  // VueUse useEventSource hook
  const { data, status, error, close: closeEventSource } = useEventSource(url, [], {
    immediate: false,
    autoReconnect: false, // Managed manually to refresh tickets on reconnect
  });

  const latestEvent = shallowRef<NotificationEvent | null>(null);
  let shouldBeConnected = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let activeConnectPromise: Promise<void> | null = null;

  // Watch incoming SSE data frames and parse with Zod
  watch(data, (raw) => {
    if (!raw) return;
    try {
      const parsedJson = JSON.parse(raw);
      const event = NotificationEventSchema.parse(parsedJson);
      latestEvent.value = event;
    } catch (err) {
      console.error("[SSE] Dropped invalid event frame:", err);
    }
  });

  // Watch for unexpected disconnection to reconnect with a fresh ticket
  watch(status, (currentStatus) => {
    if (currentStatus === "CLOSED" && shouldBeConnected) {
      scheduleReconnect();
    }
  });

  watch(error, (err) => {
    if (err && shouldBeConnected) {
      scheduleReconnect();
    }
  });

  function scheduleReconnect(delay = 3000) {
    if (!shouldBeConnected) return;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(async () => {
      if (!shouldBeConnected) return;
      try {
        await connect();
      } catch {
        scheduleReconnect(Math.min(delay * 1.5, 30000));
      }
    }, delay);
  }

  async function connect(): Promise<void> {
    shouldBeConnected = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (activeConnectPromise) {
      return activeConnectPromise;
    }

    activeConnectPromise = (async () => {
      try {
        const { ticket } = await notificationsApi.generateTicket();
        if (!shouldBeConnected) return;
        url.value = notificationsApi.getNotificationStreamUrl(ticket);
      } catch (err) {
        if (shouldBeConnected) {
          console.error("[SSE] Ticket acquisition failed, retrying in 3s:", err);
          scheduleReconnect();
        }
      } finally {
        activeConnectPromise = null;
      }
    })();

    return activeConnectPromise;
  }

  function disconnect(): void {
    shouldBeConnected = false;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    closeEventSource();
    url.value = undefined;
    latestEvent.value = null;
  }

  return {
    status,
    latestEvent,
    error,
    connect,
    disconnect,
  };
}

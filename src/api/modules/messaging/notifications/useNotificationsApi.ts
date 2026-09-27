import { useApiFetch } from "@/api/useApiFetch";
import { WsTicketResponseSchema } from "./responses";
import type { WsTicketResponse } from "./types";

export const useNotificationsApi = () => {
  // POST /notifications/ticket
  async function generateTicket(): Promise<WsTicketResponse> {
    const { data, error } = await useApiFetch("/notifications/ticket")
      .post()
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to generate WebSocket notification ticket");
    }
    return WsTicketResponseSchema.parse(data.value);
  }

  // Helper to build WebSocket stream URL
  function getNotificationStreamUrl(ticket: string, baseUrl?: string): string {
    const host = baseUrl || window.location.origin;
    const wsProtocol = host.startsWith("https") ? "wss:" : "ws:";
    const url = new URL(host);
    url.protocol = wsProtocol;
    url.pathname = "/notifications";
    url.searchParams.set("token", ticket);
    return url.toString();
  }

  return {
    generateTicket,
    getNotificationStreamUrl,
  };
};

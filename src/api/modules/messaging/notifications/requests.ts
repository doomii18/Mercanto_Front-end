import { z } from "zod";

// WsAuthQuery | query parameter token for websocket handshake
export const WsAuthQuerySchema = z.object({
  token: z.string().min(1, "El token de WebSocket es requerido"),
});

// MarkNotificationsReadDto | payload to mark notifications as read
export const MarkNotificationsReadSchema = z.object({
  ids: z.array(z.uuid()),
});

// NotificationHistoryQuery | pagination parameters for notifications history
export const NotificationHistoryQuerySchema = z.object({
  limit: z.number().int().nonnegative().optional(),
  offset: z.number().int().nonnegative().optional(),
  is_read: z.boolean().optional(),
});


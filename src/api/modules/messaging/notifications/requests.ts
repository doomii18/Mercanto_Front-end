import { z } from "zod";

// WsAuthQuery | query parameter token for websocket handshake
export const WsAuthQuerySchema = z.object({
  token: z.string().min(1, "El token de WebSocket es requerido"),
});

import { z } from "zod";

export const WsTicketResponseSchema = z.object({
  ticket: z.string(),
});

export const BaseEventSchema = z.looseObject({
  type: z.string(),
  notification_id: z.uuid(),
});

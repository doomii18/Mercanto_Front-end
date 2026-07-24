import { z } from "zod";

export const WsTicketResponseSchema = z.object({
  ticket: z.string(),
});

export const BaseEventSchema = z.looseObject({
  type: z.string(),
  notification_id: z.uuid(),
});

export const NewChatMessageEventSchema = BaseEventSchema.extend({
  type: z.literal("NewChatMessage"),
  content_preview: z.string(),
  message_id: z.uuid(),
  sender_id: z.uuid(),
  thread_id: z.uuid(),
});

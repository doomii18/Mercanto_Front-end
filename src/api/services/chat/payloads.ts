import { z } from "zod";
import { PaginatedResponseSchema } from "../../shared/schemas";

export const ChatThreadResponseSchema = z.object({
  id: z.uuid(),
  quote_group_id: z.uuid(),
  updated_at: z.iso.datetime(),
  is_archived: z.boolean(),
});

export const ChatMessageResponseSchema = z.object({
  id: z.uuid(),
  thread_id: z.uuid(),
  sender_id: z.uuid(),
  content: z.string(),
  is_read: z.boolean(),
});

export const PaginatedChatThreadResponseSchema = PaginatedResponseSchema(ChatThreadResponseSchema);
export const PaginatedChatMessageResponseSchema = PaginatedResponseSchema(ChatMessageResponseSchema);

export const PublishChatMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

export const MarkMessagesReadSchema = z.object({
  message_ids: z.array(z.uuid()),
});

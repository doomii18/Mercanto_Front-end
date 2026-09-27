import { z } from "zod";
import { PaginatedResponseSchema } from "@/api/modules/shared/schemas";

// ChatThreadResponseDto | chat thread summary and metadata
export const ChatThreadResponseSchema = z.object({
  id: z.uuid(),
  quote_group_id: z.uuid(),
  updated_at: z.iso.datetime(),
  is_archived: z.boolean(),
});

// ChatMessageResponseDto | single chat message payload
export const ChatMessageResponseSchema = z.object({
  id: z.uuid(),
  thread_id: z.uuid(),
  sender_id: z.uuid(),
  content: z.string(),
  is_read: z.boolean(),
});

// PaginatedResponseDto<ChatThreadResponseDto> | paginated list of chat threads
export const PaginatedChatThreadResponseSchema = PaginatedResponseSchema(ChatThreadResponseSchema);

// PaginatedResponseDto<ChatMessageResponseDto> | paginated list of chat messages
export const PaginatedChatMessageResponseSchema = PaginatedResponseSchema(ChatMessageResponseSchema);

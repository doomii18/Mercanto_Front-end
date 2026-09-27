import { z } from "zod";
import { MessageContentSchema } from "./domain";

// PublishChatMessageDto | payload for sending message to chat thread
export const PublishChatMessageSchema = z.object({
  content: MessageContentSchema,
});

// MarkMessagesReadDto | message ids to mark as read
export const MarkMessagesReadSchema = z.object({
  message_ids: z
    .array(z.uuid("ID de mensaje inválido"))
    .min(1, "Debe incluir al menos un ID de mensaje"),
});

// PaginationQueryDto | pagination query parameters for threads or messages
export const ChatPaginationQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

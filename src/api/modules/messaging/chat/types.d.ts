import type { z } from "zod";
import type { MessageContentSchema } from "./domain";
import type {
  PublishChatMessageSchema,
  MarkMessagesReadSchema,
  ChatPaginationQuerySchema,
} from "./requests";
import type {
  ChatThreadResponseSchema,
  ChatMessageResponseSchema,
  PaginatedChatThreadResponseSchema,
  PaginatedChatMessageResponseSchema,
} from "./responses";

export type MessageContent = z.infer<typeof MessageContentSchema>;

export type PublishChatMessageRequest = z.infer<typeof PublishChatMessageSchema>;
export type MarkMessagesReadRequest = z.infer<typeof MarkMessagesReadSchema>;
export type ChatPaginationQuery = z.infer<typeof ChatPaginationQuerySchema>;

export type ChatThreadResponse = z.infer<typeof ChatThreadResponseSchema>;
export type ChatMessageResponse = z.infer<typeof ChatMessageResponseSchema>;
export type PaginatedChatThreadResponse = z.infer<typeof PaginatedChatThreadResponseSchema>;
export type PaginatedChatMessageResponse = z.infer<typeof PaginatedChatMessageResponseSchema>;

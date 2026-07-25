import { z } from "zod";
import type {
  ChatThreadResponseSchema,
  ChatMessageResponseSchema,
  PaginatedChatThreadResponseSchema,
  PaginatedChatMessageResponseSchema,
  PublishChatMessageSchema,
  MarkMessagesReadSchema,
} from "./payloads";

export type ChatThreadResponse = z.infer<typeof ChatThreadResponseSchema>;
export type ChatMessageResponse = z.infer<typeof ChatMessageResponseSchema>;
export type PaginatedChatThreadResponse = z.infer<typeof PaginatedChatThreadResponseSchema>;
export type PaginatedChatMessageResponse = z.infer<typeof PaginatedChatMessageResponseSchema>;
export type PublishChatMessageRequest = z.infer<typeof PublishChatMessageSchema>;
export type MarkMessagesReadRequest = z.infer<typeof MarkMessagesReadSchema>;

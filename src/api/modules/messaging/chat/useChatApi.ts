import { useApiFetch } from "@/api/useApiFetch";
import {
  PublishChatMessageSchema,
  MarkMessagesReadSchema,
  ChatPaginationQuerySchema,
} from "./requests";
import {
  ChatMessageResponseSchema,
  PaginatedChatThreadResponseSchema,
  PaginatedChatMessageResponseSchema,
} from "./responses";
import type {
  ChatMessageResponse,
  PaginatedChatThreadResponse,
  PaginatedChatMessageResponse,
  PublishChatMessageRequest,
  MarkMessagesReadRequest,
  ChatPaginationQuery,
} from "./types";

export const useChatApi = () => {
  // GET /chat/threads
  async function getUserChatThreads(
    params?: ChatPaginationQuery
  ): Promise<PaginatedChatThreadResponse> {
    const validated = params ? ChatPaginationQuerySchema.parse(params) : undefined;
    const queryParams = new URLSearchParams();
    if (validated?.limit !== undefined) queryParams.append("limit", validated.limit.toString());
    if (validated?.offset !== undefined) queryParams.append("offset", validated.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/chat/threads${queryString ? `?${queryString}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch chat threads");
    }
    return PaginatedChatThreadResponseSchema.parse(data.value);
  }

  // POST /chat/threads/{thread_id}/messages
  async function publishChatMessage(
    threadId: string,
    payload: PublishChatMessageRequest
  ): Promise<ChatMessageResponse> {
    const validatedPayload = PublishChatMessageSchema.parse(payload);
    const { data, error } = await useApiFetch(`/chat/threads/${threadId}/messages`)
      .post(validatedPayload)
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to publish chat message");
    }
    return ChatMessageResponseSchema.parse(data.value);
  }

  // GET /chat/threads/{thread_id}/messages
  async function getThreadMessages(
    threadId: string,
    params?: ChatPaginationQuery
  ): Promise<PaginatedChatMessageResponse> {
    const validated = params ? ChatPaginationQuerySchema.parse(params) : undefined;
    const queryParams = new URLSearchParams();
    if (validated?.limit !== undefined) queryParams.append("limit", validated.limit.toString());
    if (validated?.offset !== undefined) queryParams.append("offset", validated.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/chat/threads/${threadId}/messages${queryString ? `?${queryString}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch messages for thread ${threadId}`);
    }
    return PaginatedChatMessageResponseSchema.parse(data.value);
  }

  // GET /chat/messages/{message_id}
  async function getChatMessage(messageId: string): Promise<ChatMessageResponse> {
    const { data, error } = await useApiFetch(`/chat/messages/${messageId}`).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch message ${messageId}`);
    }
    return ChatMessageResponseSchema.parse(data.value);
  }

  // PATCH /chat/messages/read
  async function markMessagesAsRead(payload: MarkMessagesReadRequest): Promise<void> {
    const validatedPayload = MarkMessagesReadSchema.parse(payload);
    const { error } = await useApiFetch("/chat/messages/read").patch(validatedPayload);
    if (error.value) {
      throw error.value || new Error("Failed to mark messages as read");
    }
  }

  return {
    getUserChatThreads,
    publishChatMessage,
    getThreadMessages,
    getChatMessage,
    markMessagesAsRead,
  };
};

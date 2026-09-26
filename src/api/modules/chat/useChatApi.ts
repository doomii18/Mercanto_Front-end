import { useApiFetch } from "@/api/useApiFetch";
import {
  ChatMessageResponseSchema,
  PaginatedChatThreadResponseSchema,
  PaginatedChatMessageResponseSchema,
  PublishChatMessageSchema,
  MarkMessagesReadSchema,
} from "@/api/modules/chat/schemas";
import type {
  ChatMessageResponse,
  PaginatedChatThreadResponse,
  PaginatedChatMessageResponse,
  PublishChatMessageRequest,
  MarkMessagesReadRequest,
} from "@/api/modules/chat/types";

export const useChatApi = () => {
  async function getUserChatThreads(
    params?: { limit?: number; offset?: number }
  ): Promise<PaginatedChatThreadResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined) queryParams.append("offset", params.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/chat/threads${queryString ? `?${queryString}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch chat threads");
    }
    return PaginatedChatThreadResponseSchema.parse(data.value);
  }

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

  async function getThreadMessages(
    threadId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<PaginatedChatMessageResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined) queryParams.append("offset", params.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/chat/threads/${threadId}/messages${queryString ? `?${queryString}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch messages for thread ${threadId}`);
    }
    return PaginatedChatMessageResponseSchema.parse(data.value);
  }

  async function getChatMessage(messageId: string): Promise<ChatMessageResponse> {
    const { data, error } = await useApiFetch(`/chat/messages/${messageId}`).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch message ${messageId}`);
    }
    return ChatMessageResponseSchema.parse(data.value);
  }

  async function markMessagesAsRead(payload: MarkMessagesReadRequest): Promise<void> {
    const validatedPayload = MarkMessagesReadSchema.parse(payload);
    const { error } = await useApiFetch("/chat/messages/read").patch(validatedPayload);
    if (error.value) {
      throw error.value;
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

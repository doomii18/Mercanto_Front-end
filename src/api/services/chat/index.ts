import type { ApiClient } from "../../client";
import {

  ChatMessageResponseSchema,
  PaginatedChatThreadResponseSchema,
  PaginatedChatMessageResponseSchema,
  PublishChatMessageSchema,
  MarkMessagesReadSchema,
} from "./payloads";
import type {

  ChatMessageResponse,
  PaginatedChatThreadResponse,
  PaginatedChatMessageResponse,
  PublishChatMessageRequest,
  MarkMessagesReadRequest,
} from "./types";

export class ChatService {
  constructor(private readonly client: ApiClient) {}

  async getUserChatThreads(params?: {
    limit?: number;
    offset?: number;
  }): Promise<PaginatedChatThreadResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined)
      queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined)
      queryParams.append("offset", params.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/chat/threads${queryString ? `?${queryString}` : ""}`;

    const data = await this.client.request(endpoint, { method: "GET" });
    return PaginatedChatThreadResponseSchema.parse(data);
  }

  async publishChatMessage(
    threadId: string,
    payload: PublishChatMessageRequest,
  ): Promise<ChatMessageResponse> {
    const validatedPayload = PublishChatMessageSchema.parse(payload);
    const data = await this.client.request(`/chat/threads/${threadId}/messages`, {
      method: "POST",
      body: JSON.stringify(validatedPayload),
    });
    return ChatMessageResponseSchema.parse(data);
  }

  async getThreadMessages(
    threadId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<PaginatedChatMessageResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined)
      queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined)
      queryParams.append("offset", params.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/chat/threads/${threadId}/messages${queryString ? `?${queryString}` : ""}`;

    const data = await this.client.request(endpoint, { method: "GET" });
    return PaginatedChatMessageResponseSchema.parse(data);
  }

  async getChatMessage(messageId: string): Promise<ChatMessageResponse> {
    const data = await this.client.request(`/chat/messages/${messageId}`, {
      method: "GET",
    });
    return ChatMessageResponseSchema.parse(data);
  }

  async markMessagesAsRead(payload: MarkMessagesReadRequest): Promise<void> {
    const validatedPayload = MarkMessagesReadSchema.parse(payload);
    await this.client.request("/chat/messages/read", {
      method: "PATCH",
      body: JSON.stringify(validatedPayload),
    });
  }
}

import { z } from "zod";
import { BaseEventSchema, WsTicketResponseSchema } from "./payloads";

export type WsTicketResponse = z.infer<typeof WsTicketResponseSchema>;

export type NotificationEvent = z.infer<typeof BaseEventSchema>;
export type NewChatMessageEvent = z.infer<typeof NewChatMessageEventSchema>;

export type NotificationCallback = (event: NotificationEvent) => void;

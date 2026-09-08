import { z } from "zod";
import {
  WsTicketResponseSchema,
  NotificationEventSchema,
  NewChatMessageEventSchema,
  QuoteStatusChangedEventSchema,
} from "./payloads";

export type WsTicketResponse = z.infer<typeof WsTicketResponseSchema>;

export type NotificationEvent = z.infer<typeof NotificationEventSchema>;
export type NewChatMessageEvent = z.infer<typeof NewChatMessageEventSchema>;
export type QuoteStatusChangedEvent = z.infer<typeof QuoteStatusChangedEventSchema>;

export type NotificationEventType = NotificationEvent["type"];

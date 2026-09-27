import type { z } from "zod";
import type { NotificationEventTypeSchema } from "./domain";
import type {
  WsAuthQuerySchema,
  MarkNotificationsReadSchema,
  NotificationHistoryQuerySchema,
} from "./requests";
import type {
  WsTicketResponseSchema,
  NotificationEventSchema,
  NewChatMessageEventSchema,
  QuoteStatusChangedEventSchema,
  ProductOutOfStockEventSchema,
  QuoteRequestReceivedEventSchema,
  NotificationResponseSchema,
  PaginatedNotificationsResponseSchema,
  UnreadNotificationCountSchema,
} from "./responses";

export type NotificationEventType = z.infer<typeof NotificationEventTypeSchema>;
export type WsAuthQuery = z.infer<typeof WsAuthQuerySchema>;
export type MarkNotificationsRead = z.infer<typeof MarkNotificationsReadSchema>;
export type NotificationHistoryQuery = z.infer<typeof NotificationHistoryQuerySchema>;

export type WsTicketResponse = z.infer<typeof WsTicketResponseSchema>;
export type NotificationEvent = z.infer<typeof NotificationEventSchema>;
export type NewChatMessageEvent = z.infer<typeof NewChatMessageEventSchema>;
export type QuoteStatusChangedEvent = z.infer<typeof QuoteStatusChangedEventSchema>;
export type ProductOutOfStockEvent = z.infer<typeof ProductOutOfStockEventSchema>;
export type QuoteRequestReceivedEvent = z.infer<typeof QuoteRequestReceivedEventSchema>;

export type NotificationResponse = z.infer<typeof NotificationResponseSchema>;
export type PaginatedNotificationsResponse = z.infer<typeof PaginatedNotificationsResponseSchema>;
export type UnreadNotificationCount = z.infer<typeof UnreadNotificationCountSchema>;


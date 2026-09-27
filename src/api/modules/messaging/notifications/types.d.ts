import type { z } from "zod";
import type { NotificationEventTypeSchema } from "./domain";
import type { WsAuthQuerySchema } from "./requests";
import type {
  WsTicketResponseSchema,
  NotificationEventSchema,
  NewChatMessageEventSchema,
  QuoteStatusChangedEventSchema,
  ProductOutOfStockEventSchema,
  ProductPromotedEventSchema,
  QuoteRequestReceivedEventSchema,
} from "./responses";

export type NotificationEventType = z.infer<typeof NotificationEventTypeSchema>;
export type WsAuthQuery = z.infer<typeof WsAuthQuerySchema>;

export type WsTicketResponse = z.infer<typeof WsTicketResponseSchema>;
export type NotificationEvent = z.infer<typeof NotificationEventSchema>;
export type NewChatMessageEvent = z.infer<typeof NewChatMessageEventSchema>;
export type QuoteStatusChangedEvent = z.infer<typeof QuoteStatusChangedEventSchema>;
export type ProductOutOfStockEvent = z.infer<typeof ProductOutOfStockEventSchema>;
export type ProductPromotedEvent = z.infer<typeof ProductPromotedEventSchema>;
export type QuoteRequestReceivedEvent = z.infer<typeof QuoteRequestReceivedEventSchema>;

import { z } from "zod";

// WsTicketResponseDto | single-use ticket for websocket connection
export const WsTicketResponseSchema = z.object({
  ticket: z.string(),
});

// BaseNotificationEvent | base event containing notification id
export const BaseEventSchema = z.object({
  notification_id: z.uuid(),
});

// NewChatMessagePayload | new chat message notification event
export const NewChatMessageEventSchema = BaseEventSchema.extend({
  type: z.literal("NewChatMessage"),
  message_id: z.uuid(),
  thread_id: z.uuid(),
  sender_id: z.uuid(),
  content_preview: z.string(),
});

// QuoteStatusChangedPayload | quote status changed notification event
export const QuoteStatusChangedEventSchema = BaseEventSchema.extend({
  type: z.literal("QuoteStatusChanged"),
  quote_id: z.uuid(),
  quote_group_id: z.uuid(),
  old_status: z.string(),
  new_status: z.string(),
  buyer_id: z.uuid(),
  provider_id: z.uuid(),
});

// ProductOutOfStockPayload | product out of stock notification event
export const ProductOutOfStockEventSchema = BaseEventSchema.extend({
  type: z.literal("ProductOutOfStock"),
  product_id: z.uuid(),
  product_title: z.string(),
  organization_id: z.uuid(),
});

// ProductPromotedPayload | product promoted notification event
export const ProductPromotedEventSchema = BaseEventSchema.extend({
  type: z.literal("ProductPromoted"),
  product_id: z.uuid(),
  payload: z.unknown(),
});

// QuoteRequestReceivedPayload | quote request received notification event
export const QuoteRequestReceivedEventSchema = BaseEventSchema.extend({
  type: z.literal("QuoteRequestReceived"),
  quote_id: z.uuid(),
  quote_group_id: z.uuid(),
  buyer_id: z.uuid(),
  provider_id: z.uuid(),
  item_count: z.number().int().nonnegative(),
});

// NotificationEvent | discriminated union of all incoming socket events
export const NotificationEventSchema = z.discriminatedUnion("type", [
  NewChatMessageEventSchema,
  QuoteStatusChangedEventSchema,
  ProductOutOfStockEventSchema,
  ProductPromotedEventSchema,
  QuoteRequestReceivedEventSchema,
]);

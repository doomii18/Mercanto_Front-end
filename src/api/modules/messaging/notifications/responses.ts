import { z } from "zod";
import { PaginatedResponseSchema } from "@/api/modules/shared/schemas";

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

// QuoteRequestReceivedPayload | quote request received notification event
export const QuoteRequestReceivedEventSchema = BaseEventSchema.extend({
  type: z.literal("QuoteRequestReceived"),
  quote_id: z.uuid(),
  quote_group_id: z.uuid(),
  buyer_id: z.uuid(),
  provider_id: z.uuid(),
  item_count: z.number().int().nonnegative(),
});

// WalletDepositStatusChangedPayload | wallet deposit status changed notification event
export const WalletDepositStatusChangedEventSchema = BaseEventSchema.extend({
  type: z.literal("WalletDepositStatusChanged"),
  request_id: z.uuid(),
  wallet_id: z.uuid(),
  amount: z.union([z.number(), z.string()]),
  old_status: z.string(),
  new_status: z.string(),
  reason: z.string().nullable().optional(),
});

// WalletWithdrawalStatusChangedPayload | wallet withdrawal status changed notification event
export const WalletWithdrawalStatusChangedEventSchema = BaseEventSchema.extend({
  type: z.literal("WalletWithdrawalStatusChanged"),
  request_id: z.uuid(),
  wallet_id: z.uuid(),
  amount: z.union([z.number(), z.string()]),
  old_status: z.string(),
  new_status: z.string(),
  payout_reference_code: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
});

// NotificationEvent | discriminated union of all incoming socket events
export const NotificationEventSchema = z.discriminatedUnion("type", [
  NewChatMessageEventSchema,
  QuoteStatusChangedEventSchema,
  ProductOutOfStockEventSchema,
  QuoteRequestReceivedEventSchema,
  WalletDepositStatusChangedEventSchema,
  WalletWithdrawalStatusChangedEventSchema,
]);

// NotificationResponseDto | persisted notification record
export const NotificationResponseSchema = z.object({
  id: z.uuid(),
  payload: z.record(z.string(), z.any()),
  is_read: z.boolean(),
  created_at: z.iso.datetime(),
});

// PaginatedResponse<NotificationResponseDto>
export const PaginatedNotificationsResponseSchema = PaginatedResponseSchema(NotificationResponseSchema);

// UnreadNotificationCountDto
export const UnreadNotificationCountSchema = z.object({
  count: z.number().int().nonnegative(),
});


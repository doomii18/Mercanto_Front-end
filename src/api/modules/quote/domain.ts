import { z } from "zod";

export const QuoteStatusSchema = z.enum([
  "draft",
  "pending_provider",
  "accepted",
  "rejected",
  "paid",
  "fulfilled",
  "cancelled",
]);

export const ShippingMethodSchema = z.enum(["bus", "own_delivery"]);

export const PaymentMethodSchema = z.enum(["card", "transfer", "virtual_wallet"]);

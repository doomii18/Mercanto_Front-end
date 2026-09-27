import { z } from "zod";
export { ShippingMethodSchema } from "@/api/modules/shared/schemas";

// QuoteStatus | status enum for quotations in commercial workflow
export const QuoteStatusSchema = z.enum([
  "draft",
  "pending_provider",
  "accepted",
  "rejected",
  "paid",
  "fulfilled",
  "cancelled",
]);

// PaymentMethod | supported commercial payment methods
export const PaymentMethodSchema = z.enum(["card", "transfer", "virtual_wallet"]);

// BuyerNotes | optional notes attached to quote by buyer
export const buyerNotesSchema = z
  .string()
  .trim()
  .max(1000, "Las notas no deben exceder los 1000 caracteres");

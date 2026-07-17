import { z } from "zod";

export const TransactionTypeSchema = z.enum([
  "deposit",
  "withdrawal",
  "payment",
  "refund"
]);

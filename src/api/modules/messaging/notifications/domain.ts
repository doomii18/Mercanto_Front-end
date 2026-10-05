import { z } from "zod";

// NotificationEventType | gateway notification event discriminators
export const NotificationEventTypeSchema = z.enum([
  "NewChatMessage",
  "ProductOutOfStock",
  "QuoteStatusChanged",
  "QuoteRequestReceived",
  "WalletDepositStatusChanged",
  "WalletWithdrawalStatusChanged",
]);

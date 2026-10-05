import { z } from "zod";

// PlatformBankAccountResponseDto | official bank destination managed by platform
export const PlatformBankAccountResponseSchema = z.object({
  id: z.string().uuid(),
  bank_name: z.string(),
  account_number: z.string(),
  account_type: z.string(),
  account_holder: z.string(),
  icon_hint: z.string().nullable().optional(),
  is_active: z.boolean(),
});

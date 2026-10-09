import { z } from "zod";

export const CreatePlatformBankAccountSchema = z.object({
  bank_name: z.string().min(1, "El nombre del banco es obligatorio"),
  account_number: z.string().min(4, "El número de cuenta debe tener al menos 4 caracteres"),
  account_type: z.string().min(1, "El tipo de cuenta es obligatorio"),
  account_holder: z.string().min(1, "El titular de la cuenta es obligatorio"),
  icon_hint: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export type CreatePlatformBankAccountDto = z.infer<typeof CreatePlatformBankAccountSchema>;

export const UpdatePlatformBankAccountSchema = z.object({
  bank_name: z.string().min(1).optional(),
  account_number: z.string().min(4).optional(),
  account_type: z.string().min(1).optional(),
  account_holder: z.string().min(1).optional(),
  icon_hint: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export type UpdatePlatformBankAccountDto = z.infer<typeof UpdatePlatformBankAccountSchema>;

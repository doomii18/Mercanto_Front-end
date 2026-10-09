import { z } from "zod";
import { PlatformBankAccountResponseSchema } from "./responses";
import { CreatePlatformBankAccountSchema, UpdatePlatformBankAccountSchema } from "./requests";

export type PlatformBankAccountResponse = z.infer<typeof PlatformBankAccountResponseSchema>;
export type PlatformBankAccountResponseDto = PlatformBankAccountResponse;

export type CreatePlatformBankAccountDto = z.infer<typeof CreatePlatformBankAccountSchema>;
export type UpdatePlatformBankAccountDto = z.infer<typeof UpdatePlatformBankAccountSchema>;

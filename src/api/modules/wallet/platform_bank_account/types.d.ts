import { z } from "zod";
import { PlatformBankAccountResponseSchema } from "./responses";

export type PlatformBankAccountResponse = z.infer<typeof PlatformBankAccountResponseSchema>;
export type PlatformBankAccountResponseDto = PlatformBankAccountResponse;

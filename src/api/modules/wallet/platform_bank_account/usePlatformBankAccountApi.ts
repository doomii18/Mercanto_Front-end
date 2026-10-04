import { useApiFetch } from "@/api/useApiFetch";
import { z } from "zod";
import { PlatformBankAccountResponseSchema } from "./responses";
import type { PlatformBankAccountResponse } from "./types";

export const usePlatformBankAccountApi = () => {
  // GET /platform/bank-accounts
  async function getPlatformBankAccounts(): Promise<PlatformBankAccountResponse[]> {
    const { data, error } = await useApiFetch("/platform/bank-accounts").get().json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch platform bank accounts");
    }

    return z.array(PlatformBankAccountResponseSchema).parse(data.value);
  }

  return {
    getPlatformBankAccounts,
  };
};

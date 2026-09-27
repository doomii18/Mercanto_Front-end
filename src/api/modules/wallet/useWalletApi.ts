import { useApiFetch } from "@/api/useApiFetch";
import { WalletLedgerPaginationQuerySchema } from "./requests";
import {
  VirtualWalletResponseSchema,
  PaginatedLedgerResponseSchema,
} from "./responses";
import type {
  VirtualWalletResponse,
  PaginatedLedgerResponse,
  WalletLedgerPaginationQuery,
} from "./types";

export const useWalletApi = () => {
  // GET /wallets/{id}
  async function getWallet(walletId: string): Promise<VirtualWalletResponse> {
    const { data, error } = await useApiFetch(`/wallets/${walletId}`).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch wallet ${walletId}`);
    }
    return VirtualWalletResponseSchema.parse(data.value);
  }

  // GET /wallets/{id}/ledger
  async function getWalletLedger(
    walletId: string,
    params?: WalletLedgerPaginationQuery
  ): Promise<PaginatedLedgerResponse> {
    const validated = params ? WalletLedgerPaginationQuerySchema.parse(params) : undefined;
    const queryParams = new URLSearchParams();
    if (validated?.limit !== undefined) queryParams.append("limit", validated.limit.toString());
    if (validated?.offset !== undefined) queryParams.append("offset", validated.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/wallets/${walletId}/ledger${queryString ? `?${queryString}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch ledger for wallet ${walletId}`);
    }
    return PaginatedLedgerResponseSchema.parse(data.value);
  }

  // GET /wallets/me
  async function getMyWallet(): Promise<VirtualWalletResponse> {
    const { data, error } = await useApiFetch("/wallets/me").get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch current user wallet");
    }
    return VirtualWalletResponseSchema.parse(data.value);
  }

  // GET /wallets/me/ledger
  async function getMyWalletLedger(
    params?: WalletLedgerPaginationQuery
  ): Promise<PaginatedLedgerResponse> {
    const validated = params ? WalletLedgerPaginationQuerySchema.parse(params) : undefined;
    const queryParams = new URLSearchParams();
    if (validated?.limit !== undefined) queryParams.append("limit", validated.limit.toString());
    if (validated?.offset !== undefined) queryParams.append("offset", validated.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/wallets/me/ledger${queryString ? `?${queryString}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch current user wallet ledger");
    }
    return PaginatedLedgerResponseSchema.parse(data.value);
  }

  return {
    getWallet,
    getWalletLedger,
    getMyWallet,
    getMyWalletLedger,
  };
};

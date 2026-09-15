import { useApiFetch } from "./useApiFetch";
import {
  VirtualWalletResponseSchema,
  PaginatedLedgerResponseSchema,
} from "@/api/services/wallet/payloads";
import type {
  VirtualWalletResponse,
  PaginatedLedgerResponse,
} from "@/api/services/wallet/types";

export const useWalletApi = () => {
  // SPECIFIC WALLET
  async function getWallet(walletId: string): Promise<VirtualWalletResponse> {
    const { data, error } = await useApiFetch(`/wallets/${walletId}`).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch wallet ${walletId}`);
    }
    return VirtualWalletResponseSchema.parse(data.value);
  }

  async function getWalletLedger(
    walletId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<PaginatedLedgerResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined) queryParams.append("offset", params.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/wallets/${walletId}/ledger${queryString ? `?${queryString}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch ledger for wallet ${walletId}`);
    }
    return PaginatedLedgerResponseSchema.parse(data.value);
  }

  // CURRENT USER WALLET
  async function getMyWallet(): Promise<VirtualWalletResponse> {
    const { data, error } = await useApiFetch("/wallets/me").get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch current user wallet");
    }
    return VirtualWalletResponseSchema.parse(data.value);
  }

  async function getMyWalletLedger(
    params?: { limit?: number; offset?: number }
  ): Promise<PaginatedLedgerResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined) queryParams.append("offset", params.offset.toString());

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

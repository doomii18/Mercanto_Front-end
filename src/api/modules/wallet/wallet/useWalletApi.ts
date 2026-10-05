import { useApiFetch } from "@/api/useApiFetch";
import { WalletLedgerFilterQuerySchema } from "./requests";
import {
  VirtualWalletResponseSchema,
  PaginatedLedgerResponseSchema,
} from "./responses";
import type {
  VirtualWalletResponse,
  PaginatedLedgerResponse,
  WalletLedgerFilterQuery,
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
    params?: WalletLedgerFilterQuery
  ): Promise<PaginatedLedgerResponse> {
    const validated = params ? WalletLedgerFilterQuerySchema.parse(params) : undefined;
    const queryParams = new URLSearchParams();
    if (validated?.limit !== undefined) queryParams.append("limit", validated.limit.toString());
    if (validated?.offset !== undefined) queryParams.append("offset", validated.offset.toString());
    if (validated?.kind) queryParams.append("kind", validated.kind);
    if (validated?.quote_id) queryParams.append("quote_id", validated.quote_id);
    if (validated?.correlation_id) queryParams.append("correlation_id", validated.correlation_id);
    if (validated?.min_amount !== undefined) queryParams.append("min_amount", validated.min_amount.toString());
    if (validated?.max_amount !== undefined) queryParams.append("max_amount", validated.max_amount.toString());
    if (validated?.created_after) queryParams.append("created_after", validated.created_after);
    if (validated?.created_before) queryParams.append("created_before", validated.created_before);
    if (validated?.search_term) queryParams.append("search_term", validated.search_term);
    if (validated?.sort_by) queryParams.append("sort_by", validated.sort_by);
    if (validated?.sort_direction) queryParams.append("sort_direction", validated.sort_direction);

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
    params?: WalletLedgerFilterQuery
  ): Promise<PaginatedLedgerResponse> {
    const validated = params ? WalletLedgerFilterQuerySchema.parse(params) : undefined;
    const queryParams = new URLSearchParams();
    if (validated?.limit !== undefined) queryParams.append("limit", validated.limit.toString());
    if (validated?.offset !== undefined) queryParams.append("offset", validated.offset.toString());
    if (validated?.kind) queryParams.append("kind", validated.kind);
    if (validated?.quote_id) queryParams.append("quote_id", validated.quote_id);
    if (validated?.correlation_id) queryParams.append("correlation_id", validated.correlation_id);
    if (validated?.min_amount !== undefined) queryParams.append("min_amount", validated.min_amount.toString());
    if (validated?.max_amount !== undefined) queryParams.append("max_amount", validated.max_amount.toString());
    if (validated?.created_after) queryParams.append("created_after", validated.created_after);
    if (validated?.created_before) queryParams.append("created_before", validated.created_before);
    if (validated?.search_term) queryParams.append("search_term", validated.search_term);
    if (validated?.sort_by) queryParams.append("sort_by", validated.sort_by);
    if (validated?.sort_direction) queryParams.append("sort_direction", validated.sort_direction);

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

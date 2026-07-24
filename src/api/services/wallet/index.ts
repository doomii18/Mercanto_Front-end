import type { ApiClient } from "../../client";
import {
  VirtualWalletResponseSchema,
  PaginatedLedgerResponseSchema,
} from "./payloads";
import type {
  VirtualWalletResponse,
  PaginatedLedgerResponse,
} from "./types";

export class WalletService {
  constructor(private readonly client: ApiClient) {}

  async getWallet(walletId: string): Promise<VirtualWalletResponse> {
    const data = await this.client.request(`/wallets/${walletId}`, { method: "GET" });
    return VirtualWalletResponseSchema.parse(data);
  }

  async getWalletLedger(
    walletId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<PaginatedLedgerResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined) queryParams.append("offset", params.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/wallets/${walletId}/ledger${queryString ? `?${queryString}` : ""}`;

    const data = await this.client.request(endpoint, { method: "GET" });
    return PaginatedLedgerResponseSchema.parse(data);
  }

  async getMyWallet(): Promise<VirtualWalletResponse> {
    const data = await this.client.request("/wallets/me", { method: "GET" });
    return VirtualWalletResponseSchema.parse(data);
  }

  async getMyWalletLedger(
    params?: { limit?: number; offset?: number }
  ): Promise<PaginatedLedgerResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined) queryParams.append("offset", params.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/wallets/me/ledger${queryString ? `?${queryString}` : ""}`;

    const data = await this.client.request(endpoint, { method: "GET" });
    return PaginatedLedgerResponseSchema.parse(data);
  }
}

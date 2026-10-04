import { useApiFetch } from "@/api/useApiFetch";
import { UploadUrlResponseSchema } from "@/api/modules/shared/schemas";
import type { UploadUrlResponse } from "@/api/modules/shared/types.d";
import {
  WalletLedgerPaginationQuerySchema,
  CreateDepositRequestSchema,
  CreateWithdrawalRequestSchema,
  InitiateVoucherUploadSchema,
} from "./requests";
import {
  VirtualWalletResponseSchema,
  PaginatedLedgerResponseSchema,
  PlatformBankAccountResponseSchema,
  DepositRequestResponseSchema,
  PaginatedDepositSummaryResponseSchema,
  WithdrawalRequestResponseSchema,
  PaginatedWithdrawalSummaryResponseSchema,
} from "./responses";
import type {
  VirtualWalletResponse,
  PaginatedLedgerResponse,
  WalletLedgerPaginationQuery,
  PlatformBankAccountResponse,
  CreateDepositRequest,
  DepositRequestResponse,
  PaginatedDepositSummaryResponse,
  CreateWithdrawalRequest,
  WithdrawalRequestResponse,
  PaginatedWithdrawalSummaryResponse,
  InitiateVoucherUpload,
} from "./types";
import { z } from "zod";

export const useWalletApi = () => {
  // ==========================================
  // Virtual Wallet & Ledger
  // ==========================================

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

  // ==========================================
  // Platform Bank Accounts
  // ==========================================

  // GET /platform/bank-accounts
  async function getPlatformBankAccounts(): Promise<PlatformBankAccountResponse[]> {
    const { data, error } = await useApiFetch("/platform/bank-accounts").get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch platform bank accounts");
    }
    return z.array(PlatformBankAccountResponseSchema).parse(data.value);
  }

  // ==========================================
  // Voucher Valet Parking
  // ==========================================

  // POST /wallets/me/vouchers/upload
  async function requestVoucherUpload(
    payload: InitiateVoucherUpload
  ): Promise<UploadUrlResponse> {
    const validated = InitiateVoucherUploadSchema.parse(payload);
    const { data, error } = await useApiFetch("/wallets/me/vouchers/upload")
      .post(validated)
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to initiate voucher upload");
    }
    return UploadUrlResponseSchema.parse(data.value);
  }

  // POST /wallets/me/vouchers/{blob_id}/confirm
  async function confirmVoucherUpload(blobId: string): Promise<void> {
    const { error } = await useApiFetch(`/wallets/me/vouchers/${blobId}/confirm`).post();
    if (error.value) {
      throw error.value || new Error(`Failed to confirm voucher upload ${blobId}`);
    }
  }

  // End-to-end Valet Parking helper for voucher upload
  async function uploadVoucherFile(file: File): Promise<string> {
    const uploadInfo = await requestVoucherUpload({
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
    });

    const response = await fetch(uploadInfo.presigned_url, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });

    if (!response.ok) {
      throw new Error("Failed to upload voucher binary to object storage");
    }

    await confirmVoucherUpload(uploadInfo.blob_id);
    return uploadInfo.blob_id;
  }

  // ==========================================
  // User Recharges (Deposits)
  // ==========================================

  // POST /wallets/me/recharges
  async function createRecharge(
    payload: CreateDepositRequest
  ): Promise<DepositRequestResponse> {
    const validated = CreateDepositRequestSchema.parse(payload);
    const { data, error } = await useApiFetch("/wallets/me/recharges")
      .post(validated)
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to create recharge request");
    }
    return DepositRequestResponseSchema.parse(data.value);
  }

  // GET /wallets/me/recharges
  async function getMyRecharges(
    params?: WalletLedgerPaginationQuery
  ): Promise<PaginatedDepositSummaryResponse> {
    const validated = params ? WalletLedgerPaginationQuerySchema.parse(params) : undefined;
    const queryParams = new URLSearchParams();
    if (validated?.limit !== undefined) queryParams.append("limit", validated.limit.toString());
    if (validated?.offset !== undefined) queryParams.append("offset", validated.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/wallets/me/recharges${queryString ? `?${queryString}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch my recharge requests");
    }
    return PaginatedDepositSummaryResponseSchema.parse(data.value);
  }

  // ==========================================
  // User Withdrawals (Extractions)
  // ==========================================

  // POST /wallets/me/withdrawals
  async function createWithdrawal(
    payload: CreateWithdrawalRequest
  ): Promise<WithdrawalRequestResponse> {
    const validated = CreateWithdrawalRequestSchema.parse(payload);
    const { data, error } = await useApiFetch("/wallets/me/withdrawals")
      .post(validated)
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to create withdrawal request");
    }
    return WithdrawalRequestResponseSchema.parse(data.value);
  }

  // GET /wallets/me/withdrawals
  async function getMyWithdrawals(
    params?: WalletLedgerPaginationQuery
  ): Promise<PaginatedWithdrawalSummaryResponse> {
    const validated = params ? WalletLedgerPaginationQuerySchema.parse(params) : undefined;
    const queryParams = new URLSearchParams();
    if (validated?.limit !== undefined) queryParams.append("limit", validated.limit.toString());
    if (validated?.offset !== undefined) queryParams.append("offset", validated.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/wallets/me/withdrawals${queryString ? `?${queryString}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch my withdrawal requests");
    }
    return PaginatedWithdrawalSummaryResponseSchema.parse(data.value);
  }

  return {
    getWallet,
    getWalletLedger,
    getMyWallet,
    getMyWalletLedger,
    getPlatformBankAccounts,
    requestVoucherUpload,
    confirmVoucherUpload,
    uploadVoucherFile,
    createRecharge,
    getMyRecharges,
    createWithdrawal,
    getMyWithdrawals,
  };
};

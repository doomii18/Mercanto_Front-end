import { useApiFetch } from "@/api/useApiFetch";
import {
  DepositFilterQuerySchema,
  WithdrawalFilterQuerySchema,
  RejectDepositRequestSchema,
  CompleteWithdrawalRequestSchema,
  RejectWithdrawalRequestSchema,
} from "./requests";
import {
  DepositRequestResponseSchema,
  PaginatedDepositSummaryResponseSchema,
  WithdrawalRequestResponseSchema,
  PaginatedWithdrawalSummaryResponseSchema,
  FundingMetricsResponseSchema,
  VoucherDownloadResponseSchema,
} from "./responses";
import type {
  DepositFilterQuery,
  WithdrawalFilterQuery,
  DepositRequestResponse,
  PaginatedDepositSummaryResponse,
  WithdrawalRequestResponse,
  PaginatedWithdrawalSummaryResponse,
  FundingMetricsResponse,
  CompleteWithdrawalRequest,
} from "./types";

export const useAdminPaymentsApi = () => {
  // ==========================================
  // Admin Recharges (Deposits)
  // ==========================================

  // GET /admin/payments/recharges
  async function getRecharges(
    params?: DepositFilterQuery
  ): Promise<PaginatedDepositSummaryResponse> {
    const validated = params ? DepositFilterQuerySchema.parse(params) : undefined;
    const queryParams = new URLSearchParams();
    if (validated?.limit !== undefined) queryParams.append("limit", validated.limit.toString());
    if (validated?.offset !== undefined) queryParams.append("offset", validated.offset.toString());
    if (validated?.status) queryParams.append("status", validated.status);
    if (validated?.platform_bank_account_id) {
      queryParams.append("platform_bank_account_id", validated.platform_bank_account_id);
    }
    if (validated?.search) queryParams.append("search", validated.search);

    const queryString = queryParams.toString();
    const endpoint = `/admin/payments/recharges${queryString ? `?${queryString}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch recharge requests");
    }
    return PaginatedDepositSummaryResponseSchema.parse(data.value);
  }

  // GET /admin/payments/recharges/metrics
  async function getRechargeMetrics(): Promise<FundingMetricsResponse> {
    const { data, error } = await useApiFetch("/admin/payments/recharges/metrics")
      .get()
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch recharge metrics");
    }
    return FundingMetricsResponseSchema.parse(data.value);
  }

  // GET /admin/payments/recharges/{id}
  async function getRecharge(id: string): Promise<DepositRequestResponse> {
    const { data, error } = await useApiFetch(`/admin/payments/recharges/${id}`)
      .get()
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch recharge request ${id}`);
    }
    return DepositRequestResponseSchema.parse(data.value);
  }

  // GET /admin/payments/recharges/{id}/voucher
  async function getRechargeVoucherUrl(id: string): Promise<string> {
    const { data, error } = await useApiFetch(`/admin/payments/recharges/${id}/voucher`)
      .get()
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch voucher for recharge ${id}`);
    }
    const parsed = VoucherDownloadResponseSchema.parse(data.value);
    return parsed.url;
  }

  // POST /admin/payments/recharges/{id}/approve
  async function approveRecharge(id: string): Promise<DepositRequestResponse> {
    const { data, error } = await useApiFetch(`/admin/payments/recharges/${id}/approve`)
      .post()
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to approve recharge ${id}`);
    }
    return DepositRequestResponseSchema.parse(data.value);
  }

  // POST /admin/payments/recharges/{id}/reject
  async function rejectRecharge(
    id: string,
    reason: string
  ): Promise<DepositRequestResponse> {
    const validated = RejectDepositRequestSchema.parse({ reason });
    const { data, error } = await useApiFetch(`/admin/payments/recharges/${id}/reject`)
      .post(validated)
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to reject recharge ${id}`);
    }
    return DepositRequestResponseSchema.parse(data.value);
  }

  // ==========================================
  // Admin Withdrawals (Extractions)
  // ==========================================

  // GET /admin/payments/withdrawals
  async function getWithdrawals(
    params?: WithdrawalFilterQuery
  ): Promise<PaginatedWithdrawalSummaryResponse> {
    const validated = params ? WithdrawalFilterQuerySchema.parse(params) : undefined;
    const queryParams = new URLSearchParams();
    if (validated?.limit !== undefined) queryParams.append("limit", validated.limit.toString());
    if (validated?.offset !== undefined) queryParams.append("offset", validated.offset.toString());
    if (validated?.status) queryParams.append("status", validated.status);
    if (validated?.search) queryParams.append("search", validated.search);

    const queryString = queryParams.toString();
    const endpoint = `/admin/payments/withdrawals${queryString ? `?${queryString}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch withdrawal requests");
    }
    return PaginatedWithdrawalSummaryResponseSchema.parse(data.value);
  }

  // GET /admin/payments/withdrawals/metrics
  async function getWithdrawalMetrics(): Promise<FundingMetricsResponse> {
    const { data, error } = await useApiFetch("/admin/payments/withdrawals/metrics")
      .get()
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch withdrawal metrics");
    }
    return FundingMetricsResponseSchema.parse(data.value);
  }

  // GET /admin/payments/withdrawals/{id}
  async function getWithdrawal(id: string): Promise<WithdrawalRequestResponse> {
    const { data, error } = await useApiFetch(`/admin/payments/withdrawals/${id}`)
      .get()
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch withdrawal request ${id}`);
    }
    return WithdrawalRequestResponseSchema.parse(data.value);
  }

  // POST /admin/payments/withdrawals/{id}/complete
  async function completeWithdrawal(
    id: string,
    payload?: CompleteWithdrawalRequest
  ): Promise<WithdrawalRequestResponse> {
    const validated = payload ? CompleteWithdrawalRequestSchema.parse(payload) : {};
    const { data, error } = await useApiFetch(`/admin/payments/withdrawals/${id}/complete`)
      .post(validated)
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to complete withdrawal ${id}`);
    }
    return WithdrawalRequestResponseSchema.parse(data.value);
  }

  // POST /admin/payments/withdrawals/{id}/reject
  async function rejectWithdrawal(
    id: string,
    reason: string
  ): Promise<WithdrawalRequestResponse> {
    const validated = RejectWithdrawalRequestSchema.parse({ reason });
    const { data, error } = await useApiFetch(`/admin/payments/withdrawals/${id}/reject`)
      .post(validated)
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to reject withdrawal ${id}`);
    }
    return WithdrawalRequestResponseSchema.parse(data.value);
  }

  return {
    getRecharges,
    getRechargeMetrics,
    getRecharge,
    getRechargeVoucherUrl,
    approveRecharge,
    rejectRecharge,
    getWithdrawals,
    getWithdrawalMetrics,
    getWithdrawal,
    completeWithdrawal,
    rejectWithdrawal,
  };
};

import { useApiFetch } from "@/api/useApiFetch";
import {
  CreateDepositRequestSchema,
  RejectDepositRequestSchema,
  DepositFilterQuerySchema,
} from "./requests";
import {
  DepositRequestResponseSchema,
  PaginatedDepositSummaryResponseSchema,
  FundingMetricsResponseSchema,
} from "./responses";
import type {
  CreateDepositRequest,
  RejectDepositRequest,
  DepositFilterQuery,
  DepositRequestResponse,
  PaginatedDepositSummaryResponse,
  FundingMetricsResponse,
} from "./types";

export const useDepositApi = () => {
  // ----------------------------------------------------
  // User Deposit (Recharge) Operations
  // ----------------------------------------------------

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
    params?: DepositFilterQuery
  ): Promise<PaginatedDepositSummaryResponse> {
    const validated = params ? DepositFilterQuerySchema.parse(params) : undefined;
    const queryParams = new URLSearchParams();
    if (validated?.limit !== undefined) queryParams.append("limit", validated.limit.toString());
    if (validated?.offset !== undefined) queryParams.append("offset", validated.offset.toString());
    if (validated?.wallet_id) queryParams.append("wallet_id", validated.wallet_id);
    if (validated?.status) queryParams.append("status", validated.status);
    if (validated?.platform_bank_account_id)
      queryParams.append("platform_bank_account_id", validated.platform_bank_account_id);
    if (validated?.min_amount !== undefined) queryParams.append("min_amount", validated.min_amount.toString());
    if (validated?.max_amount !== undefined) queryParams.append("max_amount", validated.max_amount.toString());
    if (validated?.created_after) queryParams.append("created_after", validated.created_after);
    if (validated?.created_before) queryParams.append("created_before", validated.created_before);
    if (validated?.deposited_after) queryParams.append("deposited_after", validated.deposited_after);
    if (validated?.deposited_before) queryParams.append("deposited_before", validated.deposited_before);
    if (validated?.search_term) queryParams.append("search_term", validated.search_term);
    if (validated?.sort_by) queryParams.append("sort_by", validated.sort_by);
    if (validated?.sort_direction) queryParams.append("sort_direction", validated.sort_direction);

    const queryString = queryParams.toString();
    const endpoint = `/wallets/me/recharges${queryString ? `?${queryString}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch my recharges");
    }

    return PaginatedDepositSummaryResponseSchema.parse(data.value);
  }

  // ----------------------------------------------------
  // Admin Deposit (Recharge) Operations
  // ----------------------------------------------------

  // GET /admin/payments/recharges
  async function getRecharges(
    params?: DepositFilterQuery
  ): Promise<PaginatedDepositSummaryResponse> {
    const validated = params ? DepositFilterQuerySchema.parse(params) : undefined;
    const queryParams = new URLSearchParams();
    if (validated?.limit !== undefined) queryParams.append("limit", validated.limit.toString());
    if (validated?.offset !== undefined) queryParams.append("offset", validated.offset.toString());
    if (validated?.wallet_id) queryParams.append("wallet_id", validated.wallet_id);
    if (validated?.status) queryParams.append("status", validated.status);
    if (validated?.platform_bank_account_id)
      queryParams.append("platform_bank_account_id", validated.platform_bank_account_id);
    if (validated?.min_amount !== undefined) queryParams.append("min_amount", validated.min_amount.toString());
    if (validated?.max_amount !== undefined) queryParams.append("max_amount", validated.max_amount.toString());
    if (validated?.created_after) queryParams.append("created_after", validated.created_after);
    if (validated?.created_before) queryParams.append("created_before", validated.created_before);
    if (validated?.deposited_after) queryParams.append("deposited_after", validated.deposited_after);
    if (validated?.deposited_before) queryParams.append("deposited_before", validated.deposited_before);
    if (validated?.search_term) queryParams.append("search_term", validated.search_term);
    if (validated?.sort_by) queryParams.append("sort_by", validated.sort_by);
    if (validated?.sort_direction) queryParams.append("sort_direction", validated.sort_direction);

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
    const { data, error } = await useApiFetch("/admin/payments/recharges/metrics").get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch recharge metrics");
    }

    return FundingMetricsResponseSchema.parse(data.value);
  }

  // GET /admin/payments/recharges/{id}
  async function getRecharge(id: string): Promise<DepositRequestResponse> {
    const { data, error } = await useApiFetch(`/admin/payments/recharges/${id}`).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch recharge request ${id}`);
    }

    return DepositRequestResponseSchema.parse(data.value);
  }

  // POST /admin/payments/recharges/{id}/approve
  async function approveRecharge(id: string): Promise<DepositRequestResponse> {
    const { data, error } = await useApiFetch(`/admin/payments/recharges/${id}/approve`)
      .post()
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to approve recharge request ${id}`);
    }

    return DepositRequestResponseSchema.parse(data.value);
  }

  // POST /admin/payments/recharges/{id}/reject
  async function rejectRecharge(
    id: string,
    payload: RejectDepositRequest
  ): Promise<DepositRequestResponse> {
    const validated = RejectDepositRequestSchema.parse(payload);
    const { data, error } = await useApiFetch(`/admin/payments/recharges/${id}/reject`)
      .post(validated)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to reject recharge request ${id}`);
    }

    return DepositRequestResponseSchema.parse(data.value);
  }

  return {
    createRecharge,
    getMyRecharges,
    getRecharges,
    getRechargeMetrics,
    getRecharge,
    approveRecharge,
    rejectRecharge,
  };
};

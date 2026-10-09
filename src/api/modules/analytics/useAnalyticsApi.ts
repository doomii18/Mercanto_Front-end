import { useApiFetch } from "@/api/useApiFetch";
import {
  DateRangeQuerySchema,
  TopProvidersQuerySchema,
  PopularProductsReportRequestSchema,
  RechargesReportRequestSchema,
  SalesReportRequestSchema,
} from "./requests";
import {
  KpiReportMetricsResponseSchema,
  CategorySalesSummaryResponseSchema,
  BankRechargesSummaryResponseSchema,
  RegionUsersSummaryResponseSchema,
  TopProvidersSummaryResponseSchema,
  OrderStatusSummaryResponseSchema,
  ProviderPayoutsSummaryResponseSchema,
  GenerateReportResponseSchema,
} from "./responses";
import type {
  DateRangeQuery,
  TopProvidersQuery,
  PopularProductsReportRequest,
  RechargesReportRequest,
  SalesReportRequest,
  KpiReportMetricsResponse,
  CategorySalesSummaryResponse,
  BankRechargesSummaryResponse,
  RegionUsersSummaryResponse,
  TopProvidersSummaryResponse,
  OrderStatusSummaryResponse,
  ProviderPayoutsSummaryResponse,
  GenerateReportResponse,
} from "./types";

export const useAnalyticsApi = () => {
  function buildDateRangeQueryString(params?: DateRangeQuery): string {
    const validated = params ? DateRangeQuerySchema.parse(params) : undefined;
    const queryParams = new URLSearchParams();
    if (validated?.start_time) queryParams.append("start_time", validated.start_time);
    if (validated?.end_time) queryParams.append("end_time", validated.end_time);
    const qs = queryParams.toString();
    return qs ? `?${qs}` : "";
  }

  // GET /admin/analytics/kpis
  async function getKpiMetrics(params?: DateRangeQuery): Promise<KpiReportMetricsResponse> {
    const endpoint = `/admin/analytics/kpis${buildDateRangeQueryString(params)}`;
    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch KPI report metrics");
    }
    return KpiReportMetricsResponseSchema.parse(data.value);
  }

  // GET /admin/analytics/category-sales
  async function getCategorySales(params?: DateRangeQuery): Promise<CategorySalesSummaryResponse> {
    const endpoint = `/admin/analytics/category-sales${buildDateRangeQueryString(params)}`;
    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch category sales metrics");
    }
    return CategorySalesSummaryResponseSchema.parse(data.value);
  }

  // GET /admin/analytics/bank-recharges
  async function getBankRecharges(params?: DateRangeQuery): Promise<BankRechargesSummaryResponse> {
    const endpoint = `/admin/analytics/bank-recharges${buildDateRangeQueryString(params)}`;
    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch bank recharges metrics");
    }
    return BankRechargesSummaryResponseSchema.parse(data.value);
  }

  // GET /admin/analytics/region-users
  async function getRegionUsers(params?: DateRangeQuery): Promise<RegionUsersSummaryResponse> {
    const endpoint = `/admin/analytics/region-users${buildDateRangeQueryString(params)}`;
    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch region users metrics");
    }
    return RegionUsersSummaryResponseSchema.parse(data.value);
  }

  // GET /admin/analytics/top-providers
  async function getTopProviders(params?: TopProvidersQuery): Promise<TopProvidersSummaryResponse> {
    const validated = params ? TopProvidersQuerySchema.parse(params) : undefined;
    const queryParams = new URLSearchParams();
    if (validated?.start_time) queryParams.append("start_time", validated.start_time);
    if (validated?.end_time) queryParams.append("end_time", validated.end_time);
    if (validated?.limit !== undefined) queryParams.append("limit", validated.limit.toString());
    const qs = queryParams.toString();
    const endpoint = `/admin/analytics/top-providers${qs ? `?${qs}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch top providers");
    }
    return TopProvidersSummaryResponseSchema.parse(data.value);
  }

  // GET /admin/analytics/order-status
  async function getOrderStatusDistribution(params?: DateRangeQuery): Promise<OrderStatusSummaryResponse> {
    const endpoint = `/admin/analytics/order-status${buildDateRangeQueryString(params)}`;
    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch order status breakdown");
    }
    return OrderStatusSummaryResponseSchema.parse(data.value);
  }

  // GET /admin/analytics/provider-payouts
  async function getProviderPayouts(params?: DateRangeQuery): Promise<ProviderPayoutsSummaryResponse> {
    const endpoint = `/admin/analytics/provider-payouts${buildDateRangeQueryString(params)}`;
    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch provider payouts");
    }
    return ProviderPayoutsSummaryResponseSchema.parse(data.value);
  }

  // POST /admin/analytics/reports/popular-products
  async function generatePopularProductsReport(
    payload: PopularProductsReportRequest
  ): Promise<GenerateReportResponse> {
    const validated = PopularProductsReportRequestSchema.parse(payload);
    const { data, error } = await useApiFetch("/admin/analytics/reports/popular-products")
      .post(validated)
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to generate popular products report");
    }
    return GenerateReportResponseSchema.parse(data.value);
  }

  // POST /admin/analytics/reports/recharges
  async function generateRechargesReport(
    payload: RechargesReportRequest
  ): Promise<GenerateReportResponse> {
    const validated = RechargesReportRequestSchema.parse(payload);
    const { data, error } = await useApiFetch("/admin/analytics/reports/recharges")
      .post(validated)
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to generate recharges report");
    }
    return GenerateReportResponseSchema.parse(data.value);
  }

  // POST /admin/analytics/reports/sales
  async function generateSalesReport(
    payload: SalesReportRequest
  ): Promise<GenerateReportResponse> {
    const validated = SalesReportRequestSchema.parse(payload);
    const { data, error } = await useApiFetch("/admin/analytics/reports/sales")
      .post(validated)
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to generate sales report");
    }
    return GenerateReportResponseSchema.parse(data.value);
  }

  function triggerReportDownload(url: string, filename?: string): void {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "reporte";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return {
    getKpiMetrics,
    getCategorySales,
    getBankRecharges,
    getRegionUsers,
    getTopProviders,
    getOrderStatusDistribution,
    getProviderPayouts,
    generatePopularProductsReport,
    generateRechargesReport,
    generateSalesReport,
    triggerReportDownload,
  };
};

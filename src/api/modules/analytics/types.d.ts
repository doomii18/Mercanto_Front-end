import type { z } from "zod";
import type {
  MetricComparisonSchema,
  KpiReportMetricsSchema,
  CategorySalesItemSchema,
  CategorySalesSummarySchema,
  BankRechargeItemSchema,
  BankRechargesSummarySchema,
  RegionUsersItemSchema,
  RegionUsersSummarySchema,
  TopProviderItemSchema,
  TopProvidersSummarySchema,
  OrderStatusItemSchema,
  OrderStatusSummarySchema,
  ProviderPayoutItemSchema,
  ProviderPayoutsSummarySchema,
} from "./domain";
import type {
  DateRangeQuerySchema,
  TopProvidersQuerySchema,
} from "./requests";
import type {
  KpiReportMetricsResponseSchema,
  CategorySalesSummaryResponseSchema,
  BankRechargesSummaryResponseSchema,
  RegionUsersSummaryResponseSchema,
  TopProvidersSummaryResponseSchema,
  OrderStatusSummaryResponseSchema,
  ProviderPayoutsSummaryResponseSchema,
} from "./responses";

export type MetricComparison = z.infer<typeof MetricComparisonSchema>;
export type KpiReportMetrics = z.infer<typeof KpiReportMetricsSchema>;
export type CategorySalesItem = z.infer<typeof CategorySalesItemSchema>;
export type CategorySalesSummary = z.infer<typeof CategorySalesSummarySchema>;
export type BankRechargeItem = z.infer<typeof BankRechargeItemSchema>;
export type BankRechargesSummary = z.infer<typeof BankRechargesSummarySchema>;
export type RegionUsersItem = z.infer<typeof RegionUsersItemSchema>;
export type RegionUsersSummary = z.infer<typeof RegionUsersSummarySchema>;
export type TopProviderItem = z.infer<typeof TopProviderItemSchema>;
export type TopProvidersSummary = z.infer<typeof TopProvidersSummarySchema>;
export type OrderStatusItem = z.infer<typeof OrderStatusItemSchema>;
export type OrderStatusSummary = z.infer<typeof OrderStatusSummarySchema>;
export type ProviderPayoutItem = z.infer<typeof ProviderPayoutItemSchema>;
export type ProviderPayoutsSummary = z.infer<typeof ProviderPayoutsSummarySchema>;

export type DateRangeQuery = z.infer<typeof DateRangeQuerySchema>;
export type TopProvidersQuery = z.infer<typeof TopProvidersQuerySchema>;

export type KpiReportMetricsResponse = z.infer<typeof KpiReportMetricsResponseSchema>;
export type CategorySalesSummaryResponse = z.infer<typeof CategorySalesSummaryResponseSchema>;
export type BankRechargesSummaryResponse = z.infer<typeof BankRechargesSummaryResponseSchema>;
export type RegionUsersSummaryResponse = z.infer<typeof RegionUsersSummaryResponseSchema>;
export type TopProvidersSummaryResponse = z.infer<typeof TopProvidersSummaryResponseSchema>;
export type OrderStatusSummaryResponse = z.infer<typeof OrderStatusSummaryResponseSchema>;
export type ProviderPayoutsSummaryResponse = z.infer<typeof ProviderPayoutsSummaryResponseSchema>;

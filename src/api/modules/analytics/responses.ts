import { z } from "zod";
import {
  KpiReportMetricsSchema,
  CategorySalesSummarySchema,
  BankRechargesSummarySchema,
  RegionUsersSummarySchema,
  TopProvidersSummarySchema,
  OrderStatusSummarySchema,
  ProviderPayoutsSummarySchema,
} from "./domain";

export const KpiReportMetricsResponseSchema = KpiReportMetricsSchema;
export const CategorySalesSummaryResponseSchema = CategorySalesSummarySchema;
export const BankRechargesSummaryResponseSchema = BankRechargesSummarySchema;
export const RegionUsersSummaryResponseSchema = RegionUsersSummarySchema;
export const TopProvidersSummaryResponseSchema = TopProvidersSummarySchema;
export const OrderStatusSummaryResponseSchema = OrderStatusSummarySchema;
export const ProviderPayoutsSummaryResponseSchema = ProviderPayoutsSummarySchema;

// GenerateReportResponse | presigned download url and metadata for generated admin report
export const GenerateReportResponseSchema = z.object({
  download_url: z.string().url("URL de descarga inválida"),
  filename: z.string(),
  expires_at: z.string(),
});

import { z } from "zod";

// DateRangeQuery | query filter parameters for temporal metric aggregations
export const DateRangeQuerySchema = z.object({
  start_time: z.string().optional(),
  end_time: z.string().optional(),
});

// TopProvidersQuery | query filter parameters including top provider limit
export const TopProvidersQuerySchema = z.object({
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  limit: z.number().int().positive().optional(),
});

import { ReportExportFormatSchema } from "./domain";

// PopularProductsReportRequest | payload for generating best-selling products report
export const PopularProductsReportRequestSchema = z.object({
  format: ReportExportFormatSchema,
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  limit: z.number().int().positive().optional(),
  provider_id: z.string().uuid("ID de proveedor inválido").optional(),
});

// RechargesReportRequest | payload for generating wallet deposits / recharges report
export const RechargesReportRequestSchema = z.object({
  format: ReportExportFormatSchema,
  start_time: z.string().optional(),
  end_time: z.string().optional(),
});

// SalesReportRequest | payload for generating general sales report
export const SalesReportRequestSchema = z.object({
  format: ReportExportFormatSchema,
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  provider_id: z.string().uuid("ID de proveedor inválido").optional(),
});

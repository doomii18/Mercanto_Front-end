import { z } from "zod";

// ----------------------------------------------------
// KPI Metrics & Comparisons
// ----------------------------------------------------

export const MetricComparisonSchema = z.object({
  current_value: z.coerce.number(),
  previous_value: z.coerce.number(),
  percentage_change: z.coerce.number(),
  is_positive: z.boolean(),
});

export const KpiReportMetricsSchema = z.object({
  sales: MetricComparisonSchema,
  orders: MetricComparisonSchema,
  active_providers: MetricComparisonSchema,
  active_buyers: MetricComparisonSchema,
  commissions: MetricComparisonSchema,
});

// ----------------------------------------------------
// 1. Category Sales
// ----------------------------------------------------

export const CategorySalesItemSchema = z.object({
  category_id: z.string(),
  category_name: z.string(),
  total_amount: z.coerce.number(),
  order_items_count: z.number().int(),
  percentage: z.coerce.number(),
});

export const CategorySalesSummarySchema = z.object({
  period_total_amount: z.coerce.number(),
  categories: z.array(CategorySalesItemSchema),
});

// ----------------------------------------------------
// 2. Bank Recharges
// ----------------------------------------------------

export const BankRechargeItemSchema = z.object({
  bank_account_id: z.string(),
  bank_name: z.string(),
  total_amount: z.coerce.number(),
  recharge_count: z.number().int(),
  percentage: z.coerce.number(),
});

export const BankRechargesSummarySchema = z.object({
  total_recharged_amount: z.coerce.number(),
  banks: z.array(BankRechargeItemSchema),
});

// ----------------------------------------------------
// 3. Region Users
// ----------------------------------------------------

export const RegionUsersItemSchema = z.object({
  region: z.string(),
  user_count: z.number().int(),
  percentage: z.coerce.number(),
});

export const RegionUsersSummarySchema = z.object({
  total_active_users: z.number().int(),
  regions: z.array(RegionUsersItemSchema),
});

// ----------------------------------------------------
// 4. Top Providers
// ----------------------------------------------------

export const TopProviderItemSchema = z.object({
  rank: z.number().int(),
  provider_id: z.string(),
  name: z.string(),
  main_category: z.string(),
  total_sales: z.coerce.number(),
  order_count: z.number().int(),
});

export const TopProvidersSummarySchema = z.object({
  providers: z.array(TopProviderItemSchema),
});

// ----------------------------------------------------
// 5. Order Statuses
// ----------------------------------------------------

export const OrderStatusItemSchema = z.object({
  status_group: z.string(),
  order_count: z.number().int(),
  percentage: z.coerce.number(),
});

export const OrderStatusSummarySchema = z.object({
  total_orders: z.number().int(),
  breakdown: z.array(OrderStatusItemSchema),
});

// ----------------------------------------------------
// 6. Provider Payouts
// ----------------------------------------------------

export const ProviderPayoutItemSchema = z.object({
  label: z.string(),
  total_amount: z.coerce.number(),
  request_count: z.number().int(),
  percentage: z.coerce.number(),
});

export const ProviderPayoutsSummarySchema = z.object({
  total_amount: z.coerce.number(),
  items: z.array(ProviderPayoutItemSchema),
});

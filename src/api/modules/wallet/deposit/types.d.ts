import { z } from "zod";
import { DepositRequestStatusSchema, DepositAmountSchema } from "./domain";
import {
  CreateDepositRequestSchema,
  RejectDepositRequestSchema,
  DepositFilterQuerySchema,
} from "./requests";
import {
  DepositRequestResponseSchema,
  DepositRequestSummaryResponseSchema,
  PaginatedDepositSummaryResponseSchema,
  FundingMetricsResponseSchema,
} from "./responses";

export type DepositRequestStatus = z.infer<typeof DepositRequestStatusSchema>;
export type DepositAmount = z.infer<typeof DepositAmountSchema>;

export type CreateDepositRequest = z.infer<typeof CreateDepositRequestSchema>;
export type CreateDepositRequestDto = CreateDepositRequest;

export type RejectDepositRequest = z.infer<typeof RejectDepositRequestSchema>;
export type RejectDepositRequestDto = RejectDepositRequest;

export type DepositFilterQuery = z.infer<typeof DepositFilterQuerySchema>;
export type DepositFilterQueryDto = DepositFilterQuery;

export type DepositRequestResponse = z.infer<typeof DepositRequestResponseSchema>;
export type DepositRequestResponseDto = DepositRequestResponse;

export type DepositRequestSummaryResponse = z.infer<typeof DepositRequestSummaryResponseSchema>;
export type DepositRequestSummaryResponseDto = DepositRequestSummaryResponse;

export type PaginatedDepositSummaryResponse = z.infer<typeof PaginatedDepositSummaryResponseSchema>;
export type PaginatedDepositSummaryResponseDto = PaginatedDepositSummaryResponse;

export type FundingMetricsResponse = z.infer<typeof FundingMetricsResponseSchema>;
export type FundingMetricsResponseDto = FundingMetricsResponse;

export type DepositMetricsResponse = FundingMetricsResponse;
export type DepositMetricsResponseDto = FundingMetricsResponseDto;

import { z } from "zod";
import { WithdrawalRequestStatusSchema, WithdrawalAmountSchema } from "./domain";
import {
  CreateWithdrawalRequestSchema,
  CompleteWithdrawalRequestSchema,
  RejectWithdrawalRequestSchema,
  WithdrawalFilterQuerySchema,
} from "./requests";
import {
  WithdrawalRequestResponseSchema,
  WithdrawalRequestSummaryResponseSchema,
  PaginatedWithdrawalSummaryResponseSchema,
  WithdrawalMetricsResponseSchema,
} from "./responses";

export type WithdrawalRequestStatus = z.infer<typeof WithdrawalRequestStatusSchema>;
export type WithdrawalAmount = z.infer<typeof WithdrawalAmountSchema>;

export type CreateWithdrawalRequest = z.infer<typeof CreateWithdrawalRequestSchema>;
export type CreateWithdrawalRequestDto = CreateWithdrawalRequest;

export type CompleteWithdrawalRequest = z.infer<typeof CompleteWithdrawalRequestSchema>;
export type CompleteWithdrawalRequestDto = CompleteWithdrawalRequest;

export type RejectWithdrawalRequest = z.infer<typeof RejectWithdrawalRequestSchema>;
export type RejectWithdrawalRequestDto = RejectWithdrawalRequest;

export type WithdrawalFilterQuery = z.infer<typeof WithdrawalFilterQuerySchema>;
export type WithdrawalFilterQueryDto = WithdrawalFilterQuery;

export type WithdrawalRequestResponse = z.infer<typeof WithdrawalRequestResponseSchema>;
export type WithdrawalRequestResponseDto = WithdrawalRequestResponse;

export type WithdrawalRequestSummaryResponse = z.infer<typeof WithdrawalRequestSummaryResponseSchema>;
export type WithdrawalRequestSummaryResponseDto = WithdrawalRequestSummaryResponse;

export type PaginatedWithdrawalSummaryResponse = z.infer<typeof PaginatedWithdrawalSummaryResponseSchema>;
export type PaginatedWithdrawalSummaryResponseDto = PaginatedWithdrawalSummaryResponse;

export type WithdrawalMetricsResponse = z.infer<typeof WithdrawalMetricsResponseSchema>;
export type WithdrawalMetricsResponseDto = WithdrawalMetricsResponse;

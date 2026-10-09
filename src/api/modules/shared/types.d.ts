import { z } from "zod";
import {
  AssetUploadRequestSchema,
  ErrorKindSchema,
  ErrorPayloadSchema,
  UploadUrlResponseSchema,
  SortDirectionSchema,
  RatingSummarySchema,
  ShippingMethodSchema,
  BatchProductQuerySchema,
  BatchCategoryQuerySchema,
  BatchProviderQuerySchema,
  BatchQuoteQuerySchema,
  BatchAccountQuerySchema,
  GeoPointSchema,
} from "./schemas";

export type ErrorKind = z.infer<typeof ErrorKindSchema>;
export type ErrorPayload = z.infer<typeof ErrorPayloadSchema>;
export type UploadUrlResponseDto = z.infer<typeof UploadUrlResponseSchema>;
export type UploadUrlResponse = UploadUrlResponseDto;
export type AssetUploadRequestDto = z.infer<typeof AssetUploadRequestSchema>;
export type AssetUploadRequest = AssetUploadRequestDto;

export type SortDirection = z.infer<typeof SortDirectionSchema>;
export type RatingSummary = z.infer<typeof RatingSummarySchema>;
export type ShippingMethod = z.infer<typeof ShippingMethodSchema>;
export type BatchProductQuery = z.infer<typeof BatchProductQuerySchema>;
export type BatchCategoryQuery = z.infer<typeof BatchCategoryQuerySchema>;
export type BatchProviderQuery = z.infer<typeof BatchProviderQuerySchema>;
export type BatchQuoteQuery = z.infer<typeof BatchQuoteQuerySchema>;
export type BatchAccountQuery = z.infer<typeof BatchAccountQuerySchema>;
export type GeoPoint = z.infer<typeof GeoPointSchema>;

import { z } from "zod";
import { InitiateVoucherUploadSchema } from "./requests";
import { VoucherDownloadResponseSchema } from "./responses";
import type { UploadUrlResponse } from "@/api/modules/shared/types";

export type InitiateVoucherUpload = z.infer<typeof InitiateVoucherUploadSchema>;
export type InitiateVoucherUploadDto = InitiateVoucherUpload;

export type VoucherDownloadResponse = z.infer<typeof VoucherDownloadResponseSchema>;
export type VoucherDownloadResponseDto = VoucherDownloadResponse;

export type { UploadUrlResponse };

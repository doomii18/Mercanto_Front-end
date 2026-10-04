import { z } from "zod";
import { UploadUrlResponseSchema } from "@/api/modules/shared/schemas";

// VoucherDownloadResponseDto | presigned download link to inspect voucher
export const VoucherDownloadResponseSchema = z.object({
  presigned_url: z.string().url("URL de descarga prefirmada inválida"),
  expires_in_seconds: z.number().int().positive(),
});

export { UploadUrlResponseSchema };

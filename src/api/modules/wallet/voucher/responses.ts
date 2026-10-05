import { z } from "zod";
import { UploadUrlResponseSchema } from "@/api/modules/shared/schemas";

// VoucherDownloadResponseDto | presigned download link to inspect voucher
export const VoucherDownloadResponseSchema = z.object({
  url: z.string().url("URL de descarga prefirmada inválida"),
});

export { UploadUrlResponseSchema };

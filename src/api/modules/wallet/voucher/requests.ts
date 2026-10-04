import { z } from "zod";

// InitiateVoucherUploadDto | payload to request presigned upload URL for payment voucher
export const InitiateVoucherUploadSchema = z.object({
  mime_type: z.string().trim().toLowerCase().min(1, "El tipo MIME es requerido").max(100),
  size_bytes: z.number().int().positive("El tamaño debe ser mayor a 0").max(10 * 1024 * 1024, "El archivo no debe exceder los 10MB"),
});

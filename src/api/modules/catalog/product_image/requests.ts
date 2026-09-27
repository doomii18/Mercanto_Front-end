import { z } from "zod";

export { BatchProductQuerySchema } from "@/api/modules/shared/schemas";

// ProductImageUploadRequestDto | payload to request product image upload URL
export const ProductImageUploadRequestSchema = z.object({
  mime_type: z.string().trim().toLowerCase().min(1, "El tipo MIME es requerido").max(100),
  size_bytes: z.number().int().positive("El tamaño del archivo debe ser mayor a 0"),
});

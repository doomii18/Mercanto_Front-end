import { z } from "zod";

// CategoryImageUploadRequestDto | payload to initiate category image upload
export const CategoryImageUploadRequestSchema = z.object({
  mime_type: z.string().trim().toLowerCase().min(1, "El tipo MIME es requerido").max(100),
  size_bytes: z.number().int().positive("El tamaño del archivo debe ser mayor a 0"),
});

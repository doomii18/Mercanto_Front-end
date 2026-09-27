import { z } from "zod";

// OrganizationLogoUploadRequestDto | payload to initiate organization logo upload
export const OrganizationLogoUploadRequestSchema = z.object({
  mime_type: z.string().min(1, "El tipo MIME es obligatorio"),
  size_bytes: z.number().int().positive("El tamaño debe ser mayor a cero"),
});

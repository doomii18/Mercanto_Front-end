import { z } from "zod";

// UploadUrlResponseDto | presigned upload url response
export const AvatarUploadUrlResponseSchema = z.object({
  blob_id: z.uuid("Identificador UUID del blob inválido"),
  presigned_url: z.url("URL prefirmada inválida"),
});

import { z } from "zod";

// ProfilePicUploadRequestDto | initiate avatar upload
export const ProfilePicUploadRequestSchema = z.object({
  mime_type: z.string().trim().toLowerCase(),
  size_bytes: z.number().int().positive(),
});

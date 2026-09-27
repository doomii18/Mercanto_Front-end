import { z } from "zod";

// MimeType | allowed avatar image mime types
export const AvatarMimeTypeSchema = z.enum([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

// AVATAR_MAX_SIZE_BYTES | maximum avatar file size 5mb
export const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024;

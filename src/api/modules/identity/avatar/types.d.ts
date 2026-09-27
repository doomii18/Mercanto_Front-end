import type { z } from "zod";
import type { AvatarMimeTypeSchema } from "./domain";
import type { ProfilePicUploadRequestSchema } from "./requests";
import type { AvatarUploadUrlResponseSchema } from "./responses";

export type AvatarMimeType = z.infer<typeof AvatarMimeTypeSchema>;
export type ProfilePicUploadRequest = z.infer<typeof ProfilePicUploadRequestSchema>;
export type AvatarUploadUrlResponse = z.infer<typeof AvatarUploadUrlResponseSchema>;

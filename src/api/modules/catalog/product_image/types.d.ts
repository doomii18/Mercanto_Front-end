import type { z } from "zod";
import type { ProductImageUploadRequestSchema } from "./requests";
import type { BatchProductImagesResponseSchema } from "./responses";

// Request types
export type ProductImageUploadRequest = z.infer<typeof ProductImageUploadRequestSchema>;

// Response types
export type BatchProductImagesResponse = z.infer<typeof BatchProductImagesResponseSchema>;

import type { z } from "zod";
import type { CategoryImageUploadRequestSchema } from "./requests";

// Request types
export type CategoryImageUploadRequest = z.infer<typeof CategoryImageUploadRequestSchema>;

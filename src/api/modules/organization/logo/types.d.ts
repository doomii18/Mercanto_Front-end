import type { z } from "zod";
import type { OrganizationLogoUploadRequestSchema } from "./requests";

// Request types
export type OrganizationLogoUploadRequest = z.infer<typeof OrganizationLogoUploadRequestSchema>;

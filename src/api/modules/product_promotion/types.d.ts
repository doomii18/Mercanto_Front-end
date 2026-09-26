import { z } from "zod";
import { PromoteProductRequestSchema, PromoteProductResponseSchema } from "./schemas";

export type PromoteProductRequest = z.infer<typeof PromoteProductRequestSchema>;
export type PromoteProductResponse = z.infer<typeof PromoteProductResponseSchema>;

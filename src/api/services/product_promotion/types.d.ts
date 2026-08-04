import { z } from "zod";
import { PromoteProductRequestSchema, PromoteProductResponseSchema } from "./payloads";

export type PromoteProductRequest = z.infer<typeof PromoteProductRequestSchema>;
export type PromoteProductResponse = z.infer<typeof PromoteProductResponseSchema>;

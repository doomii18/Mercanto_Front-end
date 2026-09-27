import type { z } from "zod";
import type { PromoteProductRequestSchema } from "./requests";
import type { PromoteProductResponseSchema } from "./responses";

export type PromoteProductRequest = z.infer<typeof PromoteProductRequestSchema>;
export type PromoteProductResponse = z.infer<typeof PromoteProductResponseSchema>;

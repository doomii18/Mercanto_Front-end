import type { z } from "zod";
import { HealthResponseSchema } from "./schemas";

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

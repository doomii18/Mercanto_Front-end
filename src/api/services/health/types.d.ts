import type { z } from "zod";
import { HealthResponseSchema } from "./payloads";

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

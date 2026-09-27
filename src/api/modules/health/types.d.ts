import type { z } from "zod";
import type { ReadinessStatusSchema } from "./domain";
import type { HealthCheckRequestSchema } from "./requests";
import type { ReadinessResponseSchema } from "./responses";

export type ReadinessStatus = z.infer<typeof ReadinessStatusSchema>;
export type HealthCheckRequest = z.infer<typeof HealthCheckRequestSchema>;
export type ReadinessResponse = z.infer<typeof ReadinessResponseSchema>;

export type HealthStatus = ReadinessStatus;
export type HealthResponse = ReadinessResponse;

import { z } from "zod";
import { ReadinessStatusSchema } from "./domain";

// ReadinessResponse | dependency readiness status payload
export const ReadinessResponseSchema = z.object({
  status: ReadinessStatusSchema,
});

export const HealthResponseSchema = ReadinessResponseSchema;

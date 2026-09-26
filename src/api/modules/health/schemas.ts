import { z } from "zod";
import { HealthStatusSchema } from "./domain";

export const HealthResponseSchema = z.object({
  status: HealthStatusSchema,
  timestamp: z.iso.datetime().optional()
});

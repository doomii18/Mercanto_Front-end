import { z } from "zod";

// ReadinessStatus | downstream dependencies readiness status
export const ReadinessStatusSchema = z.enum([
  "ready",
  "database_unreachable",
  "nats_disconnected",
]);

export const HealthStatusSchema = ReadinessStatusSchema;

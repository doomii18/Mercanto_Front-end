import { z } from "zod";

export const HealthStatusSchema = z.enum([
  "ready",
  "database_unreachable",
  "nats_disconnected",
]);

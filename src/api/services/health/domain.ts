import { z } from "zod";

export const HealthStatusSchema = z.enum(["alive", "ready"]);

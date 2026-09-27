import { z } from "zod";

// None | health probe request takes no body
export const HealthCheckRequestSchema = z.void();

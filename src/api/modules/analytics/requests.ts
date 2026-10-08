import { z } from "zod";

// DateRangeQuery | query filter parameters for temporal metric aggregations
export const DateRangeQuerySchema = z.object({
  start_time: z.string().optional(),
  end_time: z.string().optional(),
});

// TopProvidersQuery | query filter parameters including top provider limit
export const TopProvidersQuerySchema = z.object({
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  limit: z.number().int().positive().optional(),
});

import { z } from "zod";

// StockDelta | stock adjustment integer value
export const StockDeltaSchema = z.number().int();

// StockDelta | compatibility alias
export const stockDeltaSchema = StockDeltaSchema;

import { z } from "zod";
import { StockDeltaSchema } from "./domain";

// AdjustInventoryDto | stock adjustment delta
export const AdjustInventoryRequestSchema = z.object({
  available_stock_delta: StockDeltaSchema,
});

// BatchProductQueryDto | batch query for product inventory with 1 to 100 items limit
export const BatchProductQuerySchema = z.object({
  product_ids: z
    .array(z.uuid("ID de producto inválido"))
    .min(1, "El lote debe contener al menos 1 producto")
    .max(100, "El lote no debe exceder los 100 productos"),
});

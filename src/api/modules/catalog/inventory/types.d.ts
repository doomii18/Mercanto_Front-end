import type { z } from "zod";
import type { StockDeltaSchema } from "./domain";
import type { AdjustInventoryRequestSchema } from "./requests";
import type {
  PublicInventoryResponseSchema,
  InternalInventoryResponseSchema,
  BatchInventoryResponseSchema,
  InventoryResponseSchema,
} from "./responses";

export type StockDelta = z.infer<typeof StockDeltaSchema>;

export type AdjustInventoryRequest = z.infer<typeof AdjustInventoryRequestSchema>;

export type PublicInventoryResponse = z.infer<typeof PublicInventoryResponseSchema>;
export type InternalInventoryResponse = z.infer<typeof InternalInventoryResponseSchema>;
export type BatchInventoryResponse = z.infer<typeof BatchInventoryResponseSchema>;
export type InventoryResponse = z.infer<typeof InventoryResponseSchema>;

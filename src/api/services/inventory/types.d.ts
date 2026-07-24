import { z } from "zod";
import type {
  AdjustInventoryRequestSchema,
  InventoryResponseSchema,
  InternalInventoryDtoSchema,
  PublicInventoryDtoSchema,
} from "./payloads";

export type AdjustInventoryRequest = z.infer<typeof AdjustInventoryRequestSchema>;
export type InventoryResponse = z.infer<typeof InventoryResponseSchema>;
export type InternalInventoryDto = z.infer<typeof InternalInventoryDtoSchema>;
export type PublicInventoryDto = z.infer<typeof PublicInventoryDtoSchema>;

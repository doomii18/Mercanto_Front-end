import { z } from "zod";
import {
  ProductTitleSchema,
  ProductDescriptionSchema,
  ProductPriceSchema,
  UnitOfMeasureSchema,
  ShippingMethodSchema,
  ProductSpecSchema,
  ProductSpecUpdateSchema,
  ProductSortFieldSchema,
  SortDirectionSchema,
} from "./domain";

// CreateProductDto | product creation payload
export const CreateProductRequestSchema = z.object({
  provider_id: z.uuid("ID de proveedor inválido"),
  category_id: z.uuid("ID de categoría inválido"),
  title: ProductTitleSchema,
  description: ProductDescriptionSchema.optional().nullable(),
  base_price: ProductPriceSchema,
  shipping_methods: z.array(ShippingMethodSchema).min(1, "Debe seleccionar al menos un método de envío"),
  unit_of_measure: UnitOfMeasureSchema.default("piece"),
  spec: ProductSpecSchema,
});

// PatchProductDto | partial product update payload
export const PatchProductRequestSchema = z.object({
  category_id: z.uuid("ID de categoría inválido").optional().nullable(),
  title: ProductTitleSchema.optional().nullable(),
  description: ProductDescriptionSchema.optional().nullable(),
  base_price: ProductPriceSchema.optional().nullable(),
  shipping_methods: z.array(ShippingMethodSchema).optional().nullable(),
  spec: ProductSpecUpdateSchema.optional().nullable(),
});

// ProductFiltersQuery | query filters for listing products
export const ProductFiltersRequestSchema = z.object({
  limit: z.number().int().nonnegative().optional(),
  offset: z.number().int().nonnegative().optional(),
  provider_id: z.uuid().optional(),
  category_id: z.uuid().optional(),
  min_price: z.number().min(0).optional(),
  max_price: z.number().min(0).optional(),
  min_score: z.number().min(0).optional(),
  search_term: z.string().optional(),
  sort_by: ProductSortFieldSchema.optional(),
  sort_direction: SortDirectionSchema.optional(),
});

// BatchProductQueryDto | batch query for product ids with 1 to 100 items limit
export const BatchProductQuerySchema = z.object({
  product_ids: z
    .array(z.uuid("ID de producto inválido"))
    .min(1, "El lote debe contener al menos 1 producto")
    .max(100, "El lote no debe exceder los 100 productos"),
});

// ProductImageSearchUploadDto | presigned upload url request for image search
export const ProductImageSearchUploadSchema = z.object({
  mime_type: z.string().trim().toLowerCase().min(1, "El tipo MIME es requerido"),
  size_bytes: z.number().int().positive("El tamaño debe ser mayor a 0"),
});

// SearchProductsByImageDto | search products by image query
export const SearchProductsByImageSchema = z.object({
  blob_id: z.uuid("Identificador de blob inválido"),
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0),
});

// PromoteProductDto | product promotion signaling payload
export const PromoteProductRequestSchema = z.object({
  product_id: z.uuid("ID de producto inválido"),
  payload: z.unknown(),
});

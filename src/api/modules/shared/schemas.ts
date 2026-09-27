import { z } from "zod";

export const phoneNumberSchema = z
  .string({ message: "El número de teléfono es obligatorio" })
  .trim()
  .min(1, "El número de teléfono no puede estar vacío")
  .max(20, "El número de teléfono no debe exceder los 20 caracteres")
  .regex(/^\+?[1-9]\d{1,14}$/, "Formato de teléfono inválido. Use formato E.164 (ej. +50588888888 o 88888888)");

export const addressSchema = z
  .string({ message: "La dirección es obligatoria" })
  .trim()
  .min(1, "La dirección no puede estar vacía")
  .max(500, "La dirección no debe exceder los 500 caracteres");

export const ErrorKindSchema = z.enum([
  "validation",
  "unauthorized",
  "forbidden",
  "not_found",
  "conflict",
  "rate_limited",
  "internal",
  "unavailable",
  "not_implemented",
]);

export const ErrorPayloadSchema = z.object({
  kind: ErrorKindSchema,
  message: z.string(),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    limit: z.number().int().nonnegative(),
    offset: z.number().int().nonnegative(),
  });

export const UploadUrlResponseSchema = z.object({
  blob_id: z.uuid("Identificador UUID del blob inválido"),
  presigned_url: z.url("URL prefirmada inválida"),
});

export const AssetUploadRequestSchema = z.object({
  mime_type: z.string().trim().toLowerCase().min(1, "El tipo MIME es requerido").max(100),
  size_bytes: z.number().int().positive("El tamaño del archivo debe ser mayor a 0"),
});

export const SortDirectionSchema = z.enum(["asc", "desc"]);

export const RatingSummarySchema = z.object({
  average_score: z.number(),
  review_count: z.number().int().nonnegative(),
});

// ShippingMethod | shared shipping method enum
export const ShippingMethodSchema = z.enum(["bus", "own_delivery"]);

export const MIN_BATCH_SIZE = 1;
export const MAX_BATCH_SIZE = 100;

// BatchProductQueryDto | batch query for product ids (1 to 100 items)
export const BatchProductQuerySchema = z.object({
  product_ids: z
    .array(z.uuid("ID de producto inválido"))
    .min(MIN_BATCH_SIZE, "El lote debe contener al menos 1 producto")
    .max(MAX_BATCH_SIZE, "El lote no debe exceder los 100 productos"),
});

// BatchCategoryQueryDto | batch query for category ids (1 to 100 items)
export const BatchCategoryQuerySchema = z.object({
  category_ids: z
    .array(z.uuid("ID de categoría inválido"))
    .min(MIN_BATCH_SIZE, "El lote debe contener al menos 1 categoría")
    .max(MAX_BATCH_SIZE, "El lote no debe exceder las 100 categorías"),
});

// BatchProviderQueryDto | batch query for provider ids (1 to 100 items)
export const BatchProviderQuerySchema = z.object({
  provider_ids: z
    .array(z.uuid("ID de proveedor inválido"))
    .min(MIN_BATCH_SIZE, "El lote debe contener al menos 1 proveedor")
    .max(MAX_BATCH_SIZE, "El lote no debe exceder los 100 proveedores"),
});

// BatchQuoteQueryDto | batch query for quote ids (1 to 100 items)
export const BatchQuoteQuerySchema = z.object({
  quote_ids: z
    .array(z.uuid("ID de cotización inválido"))
    .min(MIN_BATCH_SIZE, "El lote debe contener al menos 1 cotización")
    .max(MAX_BATCH_SIZE, "El lote no debe exceder las 100 cotizaciones"),
});

// GeoPoint | geographic coordinates point
export const GeoPointSchema = z.object({
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
});

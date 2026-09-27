import { z } from "zod";

export { UploadUrlResponseSchema } from "@/api/modules/shared/schemas";

// BatchProductImagesResponse | mapped dictionary of product IDs to their image UUID lists
export const BatchProductImagesResponseSchema = z.record(
  z.uuid("ID de producto inválido"),
  z.array(z.uuid("ID de imagen inválido"))
);

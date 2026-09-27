import { z } from "zod";

// ProductQuantity | product quantity in cart (greater than 0)
export const ProductQuantitySchema = z.number().int().positive("La cantidad debe ser mayor a 0");

import { z } from "zod";

export const stockDeltaSchema = z.number().int();

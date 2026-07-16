import { z } from "zod";
import { ErrorKindSchema, ErrorPayloadSchema } from "./schemas";

export type ErrorKind = z.infer<typeof ErrorKindSchema>;
export type ErrorPayload = z.infer<typeof ErrorPayloadSchema>;

import { z } from "zod";

// MessageContent | chat message content length 1 to 4000 chars
export const MessageContentSchema = z
  .string()
  .trim()
  .min(1, "El mensaje no puede estar vacío")
  .max(4000, "El mensaje no debe exceder 4000 caracteres");

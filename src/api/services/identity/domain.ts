import { z } from "zod";
export { phoneNumberSchema } from "../../shared/schemas";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "El correo electrónico es requerido")
  .max(255, "El correo electrónico no debe exceder 255 caracteres")
  .regex(
    /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
    "Formato de correo electrónico inválido"
  );

export const passwordSchema = z
  .string()
  .trim()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(128, "La contraseña no debe exceder 128 caracteres");

export const securePasswordSchema = passwordSchema
  .regex(/[a-z]/, "Debe contener al menos una letra minúscula")
  .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
  .regex(/\d/, "Debe contener al menos un número");

export const personNameSchema = z
  .string()
  .trim()
  .min(1, "El nombre es requerido")
  .max(255, "El nombre no debe exceder 255 caracteres");

export const nationalIdSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^\d{3}-\d{6}-\d{4}[A-Z]$/, "Formato de cédula inválido (ej. 001-010190-0001A)");

export const uuidSchema = z.uuid("Identificador UUID inválido");

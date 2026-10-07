import { z } from "zod";

// PersonName | person first or last name
export const PersonNameSchema = z
  .string()
  .trim()
  .min(1, "El nombre no puede estar vacío")
  .max(255, "El nombre no debe exceder 255 caracteres");

// NationalId | nicaraguan cedula format (canonical: 13 digits + final letter)
export const NationalIdSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/[^A-Za-z0-9]/g, "").toUpperCase())
  .pipe(
    z
      .string()
      .regex(
        /^\d{13}[A-Z]$/,
        "Formato de cédula inválido (ej. 001-000000-0000A)"
      )
  );

// Aliases
export const personNameSchema = PersonNameSchema;
export const nationalIdSchema = NationalIdSchema;

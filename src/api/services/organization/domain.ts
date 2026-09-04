import { z } from "zod";
export { phoneNumberSchema, addressSchema } from "../../shared/schemas";

export const rucRegexStrict = /^([JNE]\d{13}|\d{13}[A-Z])$/;
export const rucRegexFormatted = /^([JNE]-?\d{13}|\d{3}-?\d{6}-?\d{4}[A-Z])$/i;

export const ProviderKindSchema = z.enum(
  ["manufacturer", "distributor", "wholesaler", "retailer", "service"],
  { message: "Seleccione un tipo de negocio válido" }
);

export const OrganizationStatusSchema = z.enum([
  "draft",
  "pending",
  "approved",
  "rejected",
]);

export const OrganizationMemberRoleSchema = z.enum([
  "owner",
  "admin",
  "publisher",
  "viewer",
]);

export const GeoPointSchema = z.object({
  latitude: z.number({ message: "La latitud es obligatoria" }),
  longitude: z.number({ message: "La longitud es obligatoria" }),
});

export const companyNameSchema = z
  .string({ message: "El nombre del negocio es obligatorio" })
  .trim()
  .min(1, "El nombre del negocio no puede estar vacío")
  .max(255, "El nombre del negocio no debe exceder los 255 caracteres");

export const taxIdSchema = z
  .string({ message: "El número RUC es obligatorio" })
  .trim()
  .min(1, "El número RUC no puede estar vacío")
  .transform((val) => val.replace(/[-\s]/g, "").toUpperCase())
  .pipe(
    z
      .string()
      .length(14, "El RUC debe tener exactamente 14 caracteres")
      .regex(
        rucRegexStrict,
        "Formato RUC inválido (ej. J0310000664348 o 0010101900001A)"
      )
  );

export const companyDescriptionSchema = z
  .string({ message: "La descripción debe ser texto" })
  .trim()
  .min(1, "La descripción no puede estar vacía")
  .max(2000, "La descripción no debe exceder los 2000 caracteres");

export const reviewerNotesSchema = z
  .string()
  .trim()
  .max(1000, "Las notas de revisión no deben exceder los 1000 caracteres");

export const documentLabelSchema = z
  .string()
  .trim()
  .max(100, "La etiqueta del documento no debe exceder los 100 caracteres");

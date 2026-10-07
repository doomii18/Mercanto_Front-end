import { z } from "zod";
export { phoneNumberSchema, addressSchema, GeoPointSchema } from "@/api/modules/shared/schemas";

// RUC validation regex for Nicaragua (canonical, no separators)
export const rucRegexStrict = /^([JNER]\d{13}|\d{13}[A-Z])$/;

// ProviderKind | provider business category
export const ProviderKindSchema = z.enum(
  ["manufacturer", "distributor", "wholesaler", "retailer", "service"],
  { message: "Seleccione un tipo de negocio válido" }
);

// OrganizationVerificationStatus | organization verification lifecycle state
export const OrganizationStatusSchema = z.enum([
  "draft",
  "pending",
  "approved",
  "rejected",
  "revoked",
]);

// OrganizationMemberRole | member role within an organization
export const OrganizationMemberRoleSchema = z.enum([
  "owner",
  "admin",
  "publisher",
  "viewer",
]);

// OrganizationSortField | supported fields for sorting providers
export const OrganizationSortFieldSchema = z.enum([
  "created_at",
  "id",
  "name",
  "score",
  "rating",
  "distance",
]);


export { SortDirectionSchema } from "@/api/modules/shared/schemas";

// CompanyName | company legal name constraint
export const companyNameSchema = z
  .string({ message: "El nombre del negocio es obligatorio" })
  .trim()
  .min(1, "El nombre del negocio no puede estar vacío")
  .max(255, "El nombre del negocio no debe exceder los 255 caracteres");

// TaxId | legal tax identification number
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

// CompanyDescription | brief description of the organization
export const companyDescriptionSchema = z
  .string({ message: "La descripción debe ser texto" })
  .trim()
  .min(1, "La descripción no puede estar vacía")
  .max(2000, "La descripción no debe exceder los 2000 caracteres");

// ReviewerNotes | administrative review notes
export const reviewerNotesSchema = z
  .string()
  .trim()
  .max(1000, "Las notas de revisión no deben exceder los 1000 caracteres");

// DocumentLabel | friendly label for a verification document
export const documentLabelSchema = z
  .string()
  .trim()
  .max(100, "La etiqueta del documento no debe exceder los 100 caracteres");

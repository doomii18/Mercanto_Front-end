import { z } from "zod";
import { PersonNameSchema, NationalIdSchema } from "./domain";
import { phoneNumberSchema } from "@/api/modules/shared/schemas";

// UserProfilePatchDto | partial user profile updates
export const UserProfilePatchRequestSchema = z.object({
  first_name: PersonNameSchema.optional(),
  last_name: PersonNameSchema.optional(),
  national_id: NationalIdSchema.nullable().optional(),
  phone_number: phoneNumberSchema.nullable().optional(),
  municipality_id: z.uuid("ID de municipio inválido").optional(),
});

// AddUserInterestsDto / RemoveUserInterestsDto | category interest ids list
export const UserInterestsRequestSchema = z.object({
  category_ids: z.array(z.uuid("ID de categoría inválido")),
});

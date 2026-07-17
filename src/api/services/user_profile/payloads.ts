import { z } from "zod";
import { personNameSchema, nationalIdSchema, phoneNumberSchema } from "./domain";

export const UserProfileResponseSchema = z.object({
  account_id: z.uuid(),
  first_name: personNameSchema,
  last_name: personNameSchema,
  national_id: nationalIdSchema.optional().nullable(),
  phone_number: phoneNumberSchema.optional().nullable(),
  avatar_blob_id: z.uuid().optional().nullable(),
  municipality_id: z.uuid().optional(),
});

export const UserProfilePatchRequestSchema = z.object({
  first_name: personNameSchema.optional().nullable(),
  last_name: personNameSchema.optional().nullable(),
  national_id: nationalIdSchema.optional().nullable(),
  phone_number: phoneNumberSchema.optional().nullable(),
});

export const UserInterestsRequestSchema = z.object({
  category_ids: z.array(z.uuid()),
});

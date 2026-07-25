import { z } from "zod";
import {
  personNameSchema,
  nationalIdSchema,
  phoneNumberSchema,
} from "./domain";

export const InternalUserProfileSchema = z.object({
  account_id: z.uuid(),
  first_name: personNameSchema,
  last_name: personNameSchema,
  national_id: nationalIdSchema.nullable().optional(),
  phone_number: phoneNumberSchema.nullable().optional(),
  avatar_blob_id: z.uuid().nullable().optional(),
  municipality_id: z.uuid(),
});
export const PublicUserProfileSchema = z.object({
  account_id: z.uuid(),
  first_name: personNameSchema,
  last_name: personNameSchema,
  avatar_blob_id: z.uuid().nullable().optional(),
});
export const UserProfileResponseSchema = z.union([
  InternalUserProfileSchema,
  PublicUserProfileSchema,
]);

export const UserProfilePatchRequestSchema = z.object({
  first_name: personNameSchema.optional().nullable(),
  last_name: personNameSchema.optional().nullable(),
  national_id: nationalIdSchema.optional().nullable(),
  phone_number: phoneNumberSchema.optional().nullable(),
});

export const UserInterestsRequestSchema = z.object({
  category_ids: z.array(z.uuid()),
});

export const ProfilePicUploadRequestDtoSchema = z.object({
  mime_type: z.string(),
  size_bytes: z.number().int().positive(),
});

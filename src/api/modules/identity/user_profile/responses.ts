import { z } from "zod";
import { PersonNameSchema, NationalIdSchema } from "./domain";
import { phoneNumberSchema } from "@/api/modules/shared/schemas";

// PublicUserProfileDto | public user profile summary
export const PublicUserProfileSchema = z.object({
  account_id: z.uuid(),
  first_name: PersonNameSchema,
  last_name: PersonNameSchema,
  avatar_blob_id: z.uuid().nullable(),
});

// InternalUserProfileDto | full authenticated user profile
export const InternalUserProfileSchema = z.object({
  account_id: z.uuid(),
  first_name: PersonNameSchema,
  last_name: PersonNameSchema,
  national_id: NationalIdSchema.nullable(),
  phone_number: phoneNumberSchema.nullable(),
  avatar_blob_id: z.uuid().nullable(),
  municipality_id: z.uuid(),
});

// UserInterestDto | user category interest item
export const UserInterestSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  image_blob_id: z.uuid().nullable(),
});

// InternalUserProfileDto | compatibility alias
export const UserProfileResponseSchema = InternalUserProfileSchema;

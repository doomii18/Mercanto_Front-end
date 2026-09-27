import type { z } from "zod";
import type { PersonNameSchema, NationalIdSchema } from "./domain";
import type {
  UserProfilePatchRequestSchema,
  UserInterestsRequestSchema,
} from "./requests";
import type {
  PublicUserProfileSchema,
  InternalUserProfileSchema,
  UserInterestSchema,
} from "./responses";

export type PersonName = z.infer<typeof PersonNameSchema>;
export type NationalId = z.infer<typeof NationalIdSchema>;

export type UserProfilePatchRequest = z.infer<typeof UserProfilePatchRequestSchema>;
export type UserInterestsRequest = z.infer<typeof UserInterestsRequestSchema>;

export type PublicUserProfileResponse = z.infer<typeof PublicUserProfileSchema>;
export type InternalUserProfileResponse = z.infer<typeof InternalUserProfileSchema>;
export type UserProfileResponse = InternalUserProfileResponse;
export type UserInterest = z.infer<typeof UserInterestSchema>;

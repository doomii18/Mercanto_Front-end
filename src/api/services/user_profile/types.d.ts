import { z } from "zod";
import type {
  UserProfileResponseSchema,
  UserProfilePatchRequestSchema,
  UserInterestsRequestSchema,
  ProfilePicUploadRequestSchema,
} from "./payloads";

export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>;
export type UserProfilePatchRequest = z.infer<typeof UserProfilePatchRequestSchema>;
export type UserInterestsRequest = z.infer<typeof UserInterestsRequestSchema>;
export type ProfilePicUploadRequestDto = z.infer<typeof ProfilePicUploadRequestSchema>;

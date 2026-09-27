import { useApiFetch } from "@/api/useApiFetch";
import { z } from "zod";
import {
  UserProfilePatchRequestSchema,
  UserInterestsRequestSchema,
} from "./requests";
import {
  PublicUserProfileSchema,
  InternalUserProfileSchema,
  UserInterestSchema,
} from "./responses";
import type {
  UserProfilePatchRequest,
  UserInterestsRequest,
  PublicUserProfileResponse,
  InternalUserProfileResponse,
  UserInterest,
} from "./types";
import { useAvatarApi } from "../avatar/useAvatarApi";

export const useUserProfileApi = () => {
  const avatarApi = useAvatarApi();

  // GET /profiles/me
  async function getMyProfile(): Promise<InternalUserProfileResponse> {
    const { data, error } = await useApiFetch("/profiles/me")
      .get()
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch current user profile");
    }

    return InternalUserProfileSchema.parse(data.value);
  }

  // PATCH /profiles/me
  async function updateMyProfile(
    payload: UserProfilePatchRequest
  ): Promise<InternalUserProfileResponse> {
    const validated = UserProfilePatchRequestSchema.parse(payload);
    const { data, error } = await useApiFetch("/profiles/me")
      .patch(validated)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to update user profile");
    }

    return InternalUserProfileSchema.parse(data.value);
  }

  // GET /profiles/{accountId}
  async function getUserProfile(accountId: string): Promise<PublicUserProfileResponse> {
    const { data, error } = await useApiFetch(`/profiles/${accountId}`)
      .get()
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch profile for account ${accountId}`);
    }

    return PublicUserProfileSchema.parse(data.value);
  }

  // PATCH /profiles/{accountId}
  async function updateUserProfile(
    accountId: string,
    payload: UserProfilePatchRequest
  ): Promise<InternalUserProfileResponse> {
    const validated = UserProfilePatchRequestSchema.parse(payload);
    const { data, error } = await useApiFetch(`/profiles/${accountId}`)
      .patch(validated)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to update profile for account ${accountId}`);
    }

    return InternalUserProfileSchema.parse(data.value);
  }

  // GET /me/interests
  async function getMyInterests(): Promise<UserInterest[]> {
    const { data, error } = await useApiFetch("/me/interests")
      .get()
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch user interests");
    }

    return z.array(UserInterestSchema).parse(data.value);
  }

  // PUT /me/interests
  async function setMyInterests(payload: UserInterestsRequest): Promise<void> {
    const validated = UserInterestsRequestSchema.parse(payload);
    const { error } = await useApiFetch("/me/interests").put(validated);

    if (error.value) {
      throw error.value || new Error("Failed to set user interests");
    }
  }

  // POST /me/interests
  async function addMyInterests(payload: UserInterestsRequest): Promise<void> {
    const validated = UserInterestsRequestSchema.parse(payload);
    const { error } = await useApiFetch("/me/interests").post(validated);

    if (error.value) {
      throw error.value || new Error("Failed to add user interests");
    }
  }

  // DELETE /me/interests
  async function removeMyInterests(payload: UserInterestsRequest): Promise<void> {
    const validated = UserInterestsRequestSchema.parse(payload);
    const { error } = await useApiFetch("/me/interests").delete(validated);

    if (error.value) {
      throw error.value || new Error("Failed to remove user interests");
    }
  }

  // GET /account/{accountId}/interests
  async function getAccountInterests(accountId: string): Promise<UserInterest[]> {
    const { data, error } = await useApiFetch(`/account/${accountId}/interests`)
      .get()
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch interests for account ${accountId}`);
    }

    return z.array(UserInterestSchema).parse(data.value);
  }

  // POST /account/{accountId}/interests
  async function addAccountInterests(
    accountId: string,
    payload: UserInterestsRequest
  ): Promise<void> {
    const validated = UserInterestsRequestSchema.parse(payload);
    const { error } = await useApiFetch(`/account/${accountId}/interests`).post(validated);

    if (error.value) {
      throw error.value || new Error(`Failed to add interests for account ${accountId}`);
    }
  }

  // DELETE /account/{accountId}/interests
  async function removeAccountInterests(
    accountId: string,
    payload: UserInterestsRequest
  ): Promise<void> {
    const validated = UserInterestsRequestSchema.parse(payload);
    const { error } = await useApiFetch(`/account/${accountId}/interests`).delete(validated);

    if (error.value) {
      throw error.value || new Error(`Failed to remove interests for account ${accountId}`);
    }
  }

  return {
    getMyProfile,
    updateMyProfile,
    getUserProfile,
    updateUserProfile,
    getMyInterests,
    setMyInterests,
    addMyInterests,
    removeMyInterests,
    getAccountInterests,
    addAccountInterests,
    removeAccountInterests,
    // Delegated avatar methods
    getProfilePictureBlob: avatarApi.getAvatarBlob,
    changeProfilePicture: avatarApi.changeAvatar,
    deleteProfilePicture: avatarApi.deleteAvatar,
  };
};

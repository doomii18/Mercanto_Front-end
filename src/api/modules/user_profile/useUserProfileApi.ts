
import { useApiFetch } from "@/api/useApiFetch";
import { z } from "zod";
import {
  UserProfileResponseSchema,
  UserProfilePatchRequestSchema,
  UserInterestsRequestSchema,
  UserInterestSchema,

} from "@/api/modules/user_profile/schemas";
import type {
  UserProfileResponse,
  UserProfilePatchRequest,
  UserInterestsRequest,
  UserInterest,

} from "@/api/modules/user_profile/types";
import {
  AssetUploadRequestSchema,
  UploadUrlResponseSchema,
} from "@/api/modules/shared/schemas";

export const useUserProfileApi = () => {
  // CURRENT USER ENDPOINTS


  async function getMyProfile(): Promise<UserProfileResponse> {
    const { data, error } = await useApiFetch("/profiles/me")
      .get()
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch current user profile");
    }

    return UserProfileResponseSchema.parse(data.value);
  }

  async function updateMyProfile(
    payload: UserProfilePatchRequest
  ): Promise<UserProfileResponse> {
    const validatedPayload = UserProfilePatchRequestSchema.parse(payload);

    const { data, error } = await useApiFetch("/profiles/me")
      .patch(validatedPayload)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to update user profile");
    }

    return UserProfileResponseSchema.parse(data.value);
  }


  // INTERESTS MANAGEMENT
  async function getMyInterests(): Promise<UserInterest[]> {
    const { data, error } = await useApiFetch("/me/interests")
      .get()
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch user interests");
    }

    return z.array(UserInterestSchema).parse(data.value);
  }

  async function setMyInterests(payload: UserInterestsRequest): Promise<void> {
    const validatedPayload = UserInterestsRequestSchema.parse(payload);

    const { error } = await useApiFetch("/me/interests")
      .put(validatedPayload);

    if (error.value) {
      throw error.value;
    }
  }

  async function addMyInterests(payload: UserInterestsRequest): Promise<void> {
    const validatedPayload = UserInterestsRequestSchema.parse(payload);

    const { error } = await useApiFetch("/me/interests")
      .post(validatedPayload);

    if (error.value) {
      throw error.value;
    }
  }

  async function removeMyInterests(payload: UserInterestsRequest): Promise<void> {
    const validatedPayload = UserInterestsRequestSchema.parse(payload);

    const { error } = await useApiFetch("/me/interests")
      .delete(validatedPayload);

    if (error.value) {
      throw error.value;
    }
  }


  // PROFILE PICTURE MANAGEMENT
  async function getProfilePictureBlob(blobId: string): Promise<Blob> {
    const { data, error } = await useApiFetch(`/avatar/${blobId}`)
      .get()
      .blob();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch profile picture");
    }

    return data.value;
  }

  async function changeProfilePicture(file: File): Promise<void> {
    // Validate image dimensions
    await validateImageDimensions(file);

    const payload = AssetUploadRequestSchema.parse({
      mime_type: file.type,
      size_bytes: file.size,
    });

    // Get presigned upload URL
    const { data: initData, error: initError } = await useApiFetch("/me/avatar/upload")
      .post(payload)
      .json();

    if (initError.value || !initData.value) {
      throw initError.value || new Error("Failed to initialize avatar upload");
    }

    const uploadInfo = UploadUrlResponseSchema.parse(initData.value);

    // Upload to storage
    const storageResponse = await fetch(uploadInfo.presigned_url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!storageResponse.ok) {
      throw new Error("Failed to upload avatar to storage");
    }

    // Confirm upload
    const { error: confirmError } = await useApiFetch(
      `/me/avatar/confirm/${uploadInfo.blob_id}`
    ).post();

    if (confirmError.value) {
      throw confirmError.value;
    }
  }

  async function deleteProfilePicture(blobId: string): Promise<void> {
    const { error } = await useApiFetch(`/me/avatar/${blobId}`)
      .delete();

    if (error.value) {
      throw error.value;
    }
  }


  // SPECIFIC ACCOUNT ENDPOINTS
  async function getUserProfile(accountId: string): Promise<UserProfileResponse> {
    const { data, error } = await useApiFetch(`/profiles/${accountId}`)
      .get()
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch profile for account ${accountId}`);
    }

    return UserProfileResponseSchema.parse(data.value);
  }

  async function updateUserProfile(
    accountId: string,
    payload: UserProfilePatchRequest
  ): Promise<UserProfileResponse> {
    const validatedPayload = UserProfilePatchRequestSchema.parse(payload);

    const { data, error } = await useApiFetch(`/profiles/${accountId}`)
      .patch(validatedPayload)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to update profile for account ${accountId}`);
    }

    return UserProfileResponseSchema.parse(data.value);
  }

  async function getAccountInterests(accountId: string): Promise<UserInterest[]> {
    const { data, error } = await useApiFetch(`/account/${accountId}/interests`)
      .get()
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch interests for account ${accountId}`);
    }

    return z.array(UserInterestSchema).parse(data.value);
  }

  async function addAccountInterests(
    accountId: string,
    payload: UserInterestsRequest
  ): Promise<void> {
    const validatedPayload = UserInterestsRequestSchema.parse(payload);

    const { error } = await useApiFetch(`/account/${accountId}/interests`)
      .post(validatedPayload);

    if (error.value) {
      throw error.value;
    }
  }

  async function removeAccountInterests(
    accountId: string,
    payload: UserInterestsRequest
  ): Promise<void> {
    const validatedPayload = UserInterestsRequestSchema.parse(payload);

    const { error } = await useApiFetch(`/account/${accountId}/interests`)
      .delete(validatedPayload);

    if (error.value) {
      throw error.value;
    }
  }


  // UTILITY FUNCTIONS
  function validateImageDimensions(file: File): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        if (img.width > 2048 || img.height > 2048) {
          reject(
            new Error(
              `Image dimensions must not exceed 2048x2048. Current: ${img.width}x${img.height}`
            )
          );
        } else {
          resolve();
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Invalid image file format."));
      };

      img.src = objectUrl;
    });
  }

  return {
    // Current user
    getMyProfile,
    updateMyProfile,

    // Interests
    getMyInterests,
    setMyInterests,
    addMyInterests,
    removeMyInterests,

    // Profile picture
    getProfilePictureBlob,
    changeProfilePicture,
    deleteProfilePicture,

    // Specific account
    getUserProfile,
    updateUserProfile,
    getAccountInterests,
    addAccountInterests,
    removeAccountInterests,
  };
};

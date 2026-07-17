import type { ApiClient } from "../../client";
import { z } from "zod";
import {
  UserProfileResponseSchema,
  UserProfilePatchRequestSchema,
  UserInterestsRequestSchema,
} from "./payloads";
import { ProductCategoryResponseSchema } from "../category/payloads";
import type {
  UserProfileResponse,
  UserProfilePatchRequest,
  UserInterestsRequest,
} from "./types";
import type { ProductCategoryResponse } from "../category/types";
import { UploadUrlResponseSchema } from "../../shared/schemas";

export class UserProfileService {
  constructor(private readonly client: ApiClient) {}

  //  Current User Endpoints
  async getMyProfile(): Promise<UserProfileResponse> {
    const data = await this.client.request("/profiles/me", { method: "GET" });
    return UserProfileResponseSchema.parse(data);
  }

  async updateMyProfile(payload: UserProfilePatchRequest): Promise<UserProfileResponse> {
    const validatedPayload = UserProfilePatchRequestSchema.parse(payload);
    const data = await this.client.request("/profiles/me", {
      method: "PATCH",
      body: JSON.stringify(validatedPayload),
    });
    return UserProfileResponseSchema.parse(data);
  }

  async getMyInterests(): Promise<ProductCategoryResponse[]> {
    const data = await this.client.request("/me/interests", { method: "GET" });
    return z.array(ProductCategoryResponseSchema).parse(data);
  }

  async addMyInterests(payload: UserInterestsRequest): Promise<void> {
    const validatedPayload = UserInterestsRequestSchema.parse(payload);
    await this.client.request("/me/interests", {
      method: "POST",
      body: JSON.stringify(validatedPayload),
    });
  }

  async removeMyInterests(payload: UserInterestsRequest): Promise<void> {
    const validatedPayload = UserInterestsRequestSchema.parse(payload);
    await this.client.request("/me/interests", {
      method: "DELETE",
      body: JSON.stringify(validatedPayload),
    });
  }

  async getProfilePictureBlobUrl(blobId: string): Promise<string> {
    const blob = await this.client.downloadBlob(`/assets/profile-picture/${blobId}`);
    return URL.createObjectURL(blob);
  }

  async changeProfilePicture(file: File): Promise<void> {
    const initData = UploadUrlResponseSchema.parse(
      await this.client.request("/assets/profile-picture", {
        method: "POST",
        body: JSON.stringify({ mime_type: file.type, size_bytes: file.size }),
      })
    );

    const storageResponse = await fetch(initData.presigned_url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!storageResponse.ok) throw new Error("Upload failed");

    // confirm
    await this.client.request(`/assets/profile-picture/${initData.blob_id}/confirm`, {
      method: "POST",
      body: JSON.stringify({}),
    });

    return
  }

  async deleteProfilePicture(blobId: string): Promise<void> {
    await this.client.request(
      `/assets/profile-picture/${blobId}`,
      { method: "DELETE" }
    );
  }

  // Specific Account Endpoints
  async getUserProfile(accountId: string): Promise<UserProfileResponse> {
    const data = await this.client.request(`/profiles/${accountId}`, { method: "GET" });
    return UserProfileResponseSchema.parse(data);
  }

  async updateUserProfile(accountId: string, payload: UserProfilePatchRequest): Promise<UserProfileResponse> {
    const validatedPayload = UserProfilePatchRequestSchema.parse(payload);
    const data = await this.client.request(`/profiles/${accountId}`, {
      method: "PATCH",
      body: JSON.stringify(validatedPayload),
    });
    return UserProfileResponseSchema.parse(data);
  }

  async getAccountInterests(accountId: string): Promise<ProductCategoryResponse[]> {
    const data = await this.client.request(`/account/${accountId}/interests`, { method: "GET" });
    return z.array(ProductCategoryResponseSchema).parse(data);
  }

  async addAccountInterests(accountId: string, payload: UserInterestsRequest): Promise<void> {
    const validatedPayload = UserInterestsRequestSchema.parse(payload);
    await this.client.request(`/account/${accountId}/interests`, {
      method: "POST",
      body: JSON.stringify(validatedPayload),
    });
  }

  async removeAccountInterests(accountId: string, payload: UserInterestsRequest): Promise<void> {
    const validatedPayload = UserInterestsRequestSchema.parse(payload);
    await this.client.request(`/account/${accountId}/interests`, {
      method: "DELETE",
      body: JSON.stringify(validatedPayload),
    });
  }
}

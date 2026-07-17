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

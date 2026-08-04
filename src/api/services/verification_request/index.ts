import type { ApiClient } from "../../client";
import {
  VerificationRequestResponseSchema,
  VerificationRequestAggregateResponseSchema,
  PaginatedVerificationRequestResponseSchema,
  CreateVerificationRequestSchema,
  SubmitVerificationRequestSchema,
  ApproveVerificationRequestSchema,
  RejectVerificationRequestSchema,
} from "./payloads";
import type {
  VerificationRequestResponse,
  VerificationRequestAggregateResponse,
  PaginatedVerificationRequestResponse,
  CreateVerificationRequest,
  SubmitVerificationRequest,
  ApproveVerificationRequest,
  RejectVerificationRequest,
} from "./types";

export class VerificationRequestService {
  constructor(private readonly client: ApiClient) {}

  async createVerificationRequest(
    payload: CreateVerificationRequest,
  ): Promise<VerificationRequestResponse> {
    const validated = CreateVerificationRequestSchema.parse(payload);
    const data = await this.client.request("/verification-requests", {
      method: "POST",
      body: JSON.stringify(validated),
    });
    return VerificationRequestResponseSchema.parse(data);
  }

  async submitVerificationRequest(
    id: string,
    payload: SubmitVerificationRequest,
  ): Promise<VerificationRequestResponse> {
    const validated = SubmitVerificationRequestSchema.parse(payload);
    const data = await this.client.request(`/verification-requests/${id}/submit`, {
      method: "POST",
      body: JSON.stringify(validated),
    });
    return VerificationRequestResponseSchema.parse(data);
  }

  async approveVerificationRequest(
    id: string,
    payload: ApproveVerificationRequest,
  ): Promise<VerificationRequestResponse> {
    const validated = ApproveVerificationRequestSchema.parse(payload);
    const data = await this.client.request(`/verification-requests/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(validated),
    });
    return VerificationRequestResponseSchema.parse(data);
  }

  async rejectVerificationRequest(
    id: string,
    payload: RejectVerificationRequest,
  ): Promise<VerificationRequestResponse> {
    const validated = RejectVerificationRequestSchema.parse(payload);
    const data = await this.client.request(`/verification-requests/${id}/reject`, {
      method: "POST",
      body: JSON.stringify(validated),
    });
    return VerificationRequestResponseSchema.parse(data);
  }

  async getVerificationRequest(
    id: string,
  ): Promise<VerificationRequestAggregateResponse> {
    const data = await this.client.request(`/verification-requests/${id}`, {
      method: "GET",
    });
    return VerificationRequestAggregateResponseSchema.parse(data);
  }

  async getOrganizationVerificationRequests(
    organizationId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<PaginatedVerificationRequestResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined) queryParams.append("offset", params.offset.toString());

    const qs = queryParams.toString();
    const endpoint = `/organizations/${organizationId}/verification-requests${qs ? `?${qs}` : ""}`;

    const data = await this.client.request(endpoint, { method: "GET" });
    return PaginatedVerificationRequestResponseSchema.parse(data);
  }

  async getPendingVerificationRequests(
    params?: { limit?: number; offset?: number },
  ): Promise<PaginatedVerificationRequestResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined) queryParams.append("offset", params.offset.toString());

    const qs = queryParams.toString();
    const endpoint = `/verification-requests/pending${qs ? `?${qs}` : ""}`;

    const data = await this.client.request(endpoint, { method: "GET" });
    return PaginatedVerificationRequestResponseSchema.parse(data);
  }
}

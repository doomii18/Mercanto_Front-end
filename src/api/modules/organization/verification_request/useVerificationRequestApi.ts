import { useApiFetch } from "@/api/useApiFetch";
import {
  CreateVerificationRequestSchema,
  SubmitVerificationRequestSchema,
  ApproveVerificationRequestSchema,
  RejectVerificationRequestSchema,
  VerificationRequestFilterQuerySchema,
} from "./requests";
import {
  VerificationRequestResponseSchema,
  VerificationRequestAggregateResponseSchema,
  PaginatedVerificationRequestResponseSchema,
} from "./responses";
import type {
  VerificationRequestResponse,
  VerificationRequestAggregateResponse,
  PaginatedVerificationRequestResponse,
  CreateVerificationRequest,
  SubmitVerificationRequest,
  ApproveVerificationRequest,
  RejectVerificationRequest,
  VerificationRequestFilterQuery,
} from "./types";

export const useVerificationRequestApi = () => {
  // POST /verification-requests
  async function createVerificationRequest(
    payload: CreateVerificationRequest
  ): Promise<VerificationRequestResponse> {
    const validated = CreateVerificationRequestSchema.parse(payload);
    const { data, error } = await useApiFetch("/verification-requests").post(validated).json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to create verification request");
    }
    return VerificationRequestResponseSchema.parse(data.value);
  }

  // POST /verification-requests/{id}/submit
  async function submitVerificationRequest(
    id: string,
    payload: SubmitVerificationRequest
  ): Promise<VerificationRequestResponse> {
    const validated = SubmitVerificationRequestSchema.parse(payload);
    const { data, error } = await useApiFetch(`/verification-requests/${id}/submit`)
      .post(validated)
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to submit verification request ${id}`);
    }
    return VerificationRequestResponseSchema.parse(data.value);
  }

  // POST /verification-requests/{id}/approve
  async function approveVerificationRequest(
    id: string,
    payload: ApproveVerificationRequest
  ): Promise<VerificationRequestResponse> {
    const validated = ApproveVerificationRequestSchema.parse(payload);
    const { data, error } = await useApiFetch(`/verification-requests/${id}/approve`)
      .post(validated)
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to approve verification request ${id}`);
    }
    return VerificationRequestResponseSchema.parse(data.value);
  }

  // POST /verification-requests/{id}/reject
  async function rejectVerificationRequest(
    id: string,
    payload: RejectVerificationRequest
  ): Promise<VerificationRequestResponse> {
    const validated = RejectVerificationRequestSchema.parse(payload);
    const { data, error } = await useApiFetch(`/verification-requests/${id}/reject`)
      .post(validated)
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to reject verification request ${id}`);
    }
    return VerificationRequestResponseSchema.parse(data.value);
  }

  // GET /verification-requests/{id}
  async function getVerificationRequest(
    id: string
  ): Promise<VerificationRequestAggregateResponse> {
    const { data, error } = await useApiFetch(`/verification-requests/${id}`).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch verification request ${id}`);
    }
    return VerificationRequestAggregateResponseSchema.parse(data.value);
  }

  // GET /providers/{organization_id}/verification-requests
  async function getOrganizationVerificationRequests(
    organizationId: string,
    params?: VerificationRequestFilterQuery
  ): Promise<PaginatedVerificationRequestResponse> {
    const validated = params ? VerificationRequestFilterQuerySchema.parse(params) : undefined;
    const queryParams = new URLSearchParams();
    if (validated?.limit !== undefined) queryParams.append("limit", validated.limit.toString());
    if (validated?.offset !== undefined) queryParams.append("offset", validated.offset.toString());
    if (validated?.status) queryParams.append("status", validated.status);
    if (validated?.submitted_after) queryParams.append("submitted_after", validated.submitted_after);
    if (validated?.submitted_before) queryParams.append("submitted_before", validated.submitted_before);
    if (validated?.sort_by) queryParams.append("sort_by", validated.sort_by);
    if (validated?.sort_direction) queryParams.append("sort_direction", validated.sort_direction);

    const qs = queryParams.toString();
    const endpoint = `/providers/${organizationId}/verification-requests${qs ? `?${qs}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch verification requests for organization ${organizationId}`);
    }
    return PaginatedVerificationRequestResponseSchema.parse(data.value);
  }

  // GET /verification-requests/pending
  async function getPendingVerificationRequests(
    params?: VerificationRequestFilterQuery
  ): Promise<PaginatedVerificationRequestResponse> {
    const validated = params ? VerificationRequestFilterQuerySchema.parse(params) : undefined;
    const queryParams = new URLSearchParams();
    if (validated?.limit !== undefined) queryParams.append("limit", validated.limit.toString());
    if (validated?.offset !== undefined) queryParams.append("offset", validated.offset.toString());
    if (validated?.status) queryParams.append("status", validated.status);
    if (validated?.submitted_after) queryParams.append("submitted_after", validated.submitted_after);
    if (validated?.submitted_before) queryParams.append("submitted_before", validated.submitted_before);
    if (validated?.sort_by) queryParams.append("sort_by", validated.sort_by);
    if (validated?.sort_direction) queryParams.append("sort_direction", validated.sort_direction);

    const qs = queryParams.toString();
    const endpoint = `/verification-requests/pending${qs ? `?${qs}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch pending verification requests");
    }
    return PaginatedVerificationRequestResponseSchema.parse(data.value);
  }

  return {
    createVerificationRequest,
    submitVerificationRequest,
    approveVerificationRequest,
    rejectVerificationRequest,
    getVerificationRequest,
    getOrganizationVerificationRequests,
    getPendingVerificationRequests,
  };
};

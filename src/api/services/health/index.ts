import type { ApiClient } from "../../client";
import { HealthResponseSchema } from "./payloads";
import type { HealthResponse } from "./types";

export class HealthService {
  constructor(private readonly client: ApiClient) {}

  async getLiveness(): Promise<HealthResponse> {
    return this.client.request(
      "/health/live",
      { method: "GET" },
      HealthResponseSchema,
    );
  }

  async getReadiness(): Promise<HealthResponse> {
    return this.client.request(
      "/health/ready",
      { method: "GET" },
      HealthResponseSchema,
    );
  }
}

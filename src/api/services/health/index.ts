import type { ApiClient } from "../../client";
import { HealthResponseSchema } from "./payloads";
import type { HealthResponse } from "./types";

export class HealthService {
  constructor(private readonly client: ApiClient) {}

  async getLiveness(): Promise<HealthResponse> {
    const data = await this.client.request("/health/live", { method: "GET" });
    return HealthResponseSchema.parse(data);
  }

  async getReadiness(): Promise<HealthResponse> {
    const data = await this.client.request("/health/ready", { method: "GET" });
    return HealthResponseSchema.parse(data);
  }
}

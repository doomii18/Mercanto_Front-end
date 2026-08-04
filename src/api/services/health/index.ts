import type { ApiClient } from "../../client";
import { HealthResponseSchema } from "./payloads";
import type { HealthResponse } from "./types";

export class HealthService {
  constructor(private readonly client: ApiClient) {}

  async getLiveness(): Promise<void> {
    const response = await this.client.requestRaw("/health/live", { method: "GET" });
    if (!response.ok) throw new Error("Liveness check failed");
  }

  async getReadiness(): Promise<HealthResponse> {
    const data = await this.client.request("/health/ready", { method: "GET" });
    return HealthResponseSchema.parse(data);
  }
}

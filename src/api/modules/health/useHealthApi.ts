import { useApiFetch } from "@/api/useApiFetch";
import { ReadinessResponseSchema } from "./responses";
import type { ReadinessResponse } from "./types";

export const useHealthApi = () => {
  // GET /health/live
  async function getLiveness(): Promise<void> {
    const { error } = await useApiFetch("/health/live").get();
    if (error.value) {
      throw error.value instanceof Error ? error.value : new Error("Liveness check failed");
    }
  }

  // GET /health/ready
  async function getReadiness(): Promise<ReadinessResponse> {
    const { data, error } = await useApiFetch("/health/ready").get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Readiness check failed");
    }
    return ReadinessResponseSchema.parse(data.value);
  }

  return {
    getLiveness,
    getReadiness,
  };
};

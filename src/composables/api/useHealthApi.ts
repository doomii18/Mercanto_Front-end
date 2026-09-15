import { useApiFetch } from "./useApiFetch";
import { HealthResponseSchema } from "@/api/services/health/payloads";
import type { HealthResponse } from "@/api/services/health/types";

export const useHealthApi = () => {
  async function getLiveness(): Promise<void> {
    // Liveness endpoints typically return 200/204 with no body
    const { error } = await useApiFetch("/health/live").get();
    if (error.value) {
      throw error.value instanceof Error ? error.value : new Error("Liveness check failed");
    }
  }

  async function getReadiness(): Promise<HealthResponse> {
    const { data, error } = await useApiFetch("/health/ready").get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Readiness check failed");
    }
    return HealthResponseSchema.parse(data.value);
  }

  return {
    getLiveness,
    getReadiness,
  };
};

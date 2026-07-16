import { ApiClient } from "./client";
import { HealthService } from "./services/health";
import { IdentityService } from "./services/identity";
import { LocalStorageTokenProvider } from "./token";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
if (!API_BASE_URL)
  throw new Error("FATAL CONFIGURATION ERROR: VITE_API_BASE_URL is missing.");


export const tokenProvider = new LocalStorageTokenProvider();

const apiConfig = {
  baseUrl: API_BASE_URL,
  onSessionExpired: () => {
    console.warn("Session expired")
  },
}
export const apiClient = new ApiClient(apiConfig, tokenProvider);

export const identityApi = new IdentityService(apiClient, tokenProvider);
export const healthApi = new HealthService(apiClient);

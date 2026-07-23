import { ApiClient } from "./client";
import { CartService } from "./services/cart";
import { CategoryService } from "./services/category";
import { GeographyService } from "./services/geography";
import { HealthService } from "./services/health";
import { IdentityService } from "./services/identity";
import { InventoryService } from "./services/inventory";
import { NotificationsService } from "./services/notifications";
import { OrganizationService } from "./services/organization";
import { ProductService } from "./services/product";
import { QuoteService } from "./services/quote";
import { ReviewService } from "./services/review";
import { UserProfileService } from "./services/user_profile";
import { WalletService } from "./services/wallet";
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
export const cartApi = new CartService(apiClient);
export const categoryApi = new CategoryService(apiClient);
export const geographyApi = new GeographyService(apiClient);
export const userProfileApi = new UserProfileService(apiClient);
export const walletApi = new WalletService(apiClient);
export const inventoryApi = new InventoryService(apiClient);
export const organizationApi = new OrganizationService(apiClient);
export const quoteApi = new QuoteService(apiClient);
export const productApi = new ProductService(apiClient);
export const reviewApi = new ReviewService(apiClient);
export const notificationsApi = new NotificationsService(apiClient);


export async function bootstrapSession(): Promise<void> {
  const currentRefresh = tokenProvider.getRefreshToken();
  if (!currentRefresh) {
    return;
  }

  try {
    await identityApi.refresh({ refresh_token: currentRefresh });
  } catch (error) {
    console.error("Session bootstrap failed. Purging credentials.");
    tokenProvider.setRefreshToken(null);
    window.location.assign('/login.html');
  }
}

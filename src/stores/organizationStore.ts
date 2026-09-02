import { defineStore } from "pinia";
import { ref } from "vue";
import { organizationApi } from "@/api";
import { StoreCache } from "@/utils/cache";
import type {
  PublicProviderDto,
  OrganizationDetailsDto,
  ProviderOrganizationPatch,
  RegisterProviderRequest,
} from "@/api/services/organization/types";

export const useOrganizationStore = defineStore("organization", () => {
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  // L1 + L2 (IndexedDB Persistent, 6 Hours TTL)
  const publicProviderCache = new StoreCache<PublicProviderDto>({
    persistent: true,
    dbName: "mercanto_org_db",
    storeName: "public_providers",
    ttlMs: 1000 * 60 * 60 * 6,
    maxMemoryEntries: 300,
  });

  // L1 Only (In-Memory, 5 Minutes TTL)
  const privateOrgCache = new StoreCache<OrganizationDetailsDto>({
    persistent: false,
    ttlMs: 1000 * 60 * 5,
    maxMemoryEntries: 50,
  });

  async function getPublicProvider(
    id: string,
    forceRefresh = false,
  ): Promise<PublicProviderDto> {
    return publicProviderCache.getOrFetch(
      id,
      () => organizationApi.getPublicProvider(id),
      { forceRefresh },
    );
  }

  async function getOrganizationDetails(
    id: string,
    forceRefresh = false,
  ): Promise<OrganizationDetailsDto> {
    return privateOrgCache.getOrFetch(
      id,
      () => organizationApi.getOrganizationDetails(id),
      { forceRefresh },
    );
  }

  async function createOrganization(
    payload: RegisterProviderRequest,
  ): Promise<OrganizationDetailsDto> {
    isLoading.value = true;
    error.value = null;
    try {
      const org = await organizationApi.createOrganization(payload);
      await privateOrgCache.set(org.id, org);
      return org;
    } catch (err: any) {
      error.value = err instanceof Error ? err : new Error(String(err));
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateOrganization(
    id: string,
    patch: ProviderOrganizationPatch,
  ): Promise<OrganizationDetailsDto> {
    isLoading.value = true;
    error.value = null;
    try {
      const updated = await organizationApi.patchOrganization(id, patch);
      await Promise.all([
        privateOrgCache.set(id, updated),
        publicProviderCache.invalidate(id),
      ]);
      return updated;
    } catch (err: any) {
      error.value = err instanceof Error ? err : new Error(String(err));
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  }

  async function invalidateOrganization(id: string): Promise<void> {
    await Promise.all([
      publicProviderCache.invalidate(id),
      privateOrgCache.invalidate(id),
    ]);
  }

  async function resetAllCaches(): Promise<void> {
    await Promise.all([
      publicProviderCache.clear(),
      privateOrgCache.clear(),
    ]);
  }

  return {
    isLoading,
    error,
    getPublicProvider,
    getOrganizationDetails,
    createOrganization,
    updateOrganization,
    invalidateOrganization,
    resetAllCaches,
  };
});

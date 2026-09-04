import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { organizationApi } from "@/api";
import type { OrganizationDetailsDto } from "@/api/services/organization/types";

export type UserGroup = "buyer" | "provider";

export const useUserContextStore = defineStore("userContext", () => {
  const organizations = ref<OrganizationDetailsDto[]>([]);
  const activeOrganizationId = ref<string | null>(null);
  const isInitialized = ref(false);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  let initPromise: Promise<void> | null = null;

  const activeOrganization = computed<OrganizationDetailsDto | null>(() => {
    if (!organizations.value.length) return null;
    return (
      organizations.value.find((org) => org.id === activeOrganizationId.value) ??
      organizations.value[0]
    );
  });

  const userGroup = computed<UserGroup>(() =>
    organizations.value.length > 0 ? "provider" : "buyer"
  );

  const isProvider = computed(() => userGroup.value === "provider");
  const isBuyer = computed(() => userGroup.value === "buyer");

  async function initialize(forceRefresh = false): Promise<void> {
    if (isInitialized.value && !forceRefresh) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      isLoading.value = true;
      error.value = null;

      try {
        const orgs = await organizationApi.getMyOrganizations();
        organizations.value = orgs;

        // Auto-select first provider organization as workaround
        activeOrganizationId.value = orgs.length > 0 ? orgs[0].id : null;
      } catch (err: any) {
        error.value = err instanceof Error ? err : new Error(String(err));
        organizations.value = [];
        activeOrganizationId.value = null;
        throw error.value;
      } finally {
        isLoading.value = false;
        isInitialized.value = true;
        initPromise = null;
      }
    })();

    return initPromise;
  }

  function setActiveOrganization(orgId: string): void {
    const exists = organizations.value.some((org) => org.id === orgId);
    if (!exists) {
      throw new Error(`Organization ${orgId} not associated with current account.`);
    }
    activeOrganizationId.value = orgId;
  }

  function reset(): void {
    organizations.value = [];
    activeOrganizationId.value = null;
    isInitialized.value = false;
    error.value = null;
    initPromise = null;
  }

  return {
    organizations,
    activeOrganizationId,
    activeOrganization,
    userGroup,
    isProvider,
    isBuyer,
    isInitialized,
    isLoading,
    error,
    initialize,
    setActiveOrganization,
    reset,
  };
});

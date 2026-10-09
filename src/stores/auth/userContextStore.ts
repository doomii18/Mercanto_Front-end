import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { OrganizationDetailsDto, UserProfileResponse } from "@/api";
import { useUserProfileApi } from "@/api/modules/identity/user_profile/useUserProfileApi";
import { useOrganizationApi } from "@/api/modules/organization/organization/useOrganizationApi";
import { useAuthStore } from "./authStore";

export type UserGroup = "buyer" | "provider";
export type OrganizationVerificationStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "revoked";

export const useUserContextStore = defineStore("userContext", () => {
  const authStore = useAuthStore();
  const userProfileApi = useUserProfileApi();
  const organizationApi = useOrganizationApi();

  const organizations = ref<OrganizationDetailsDto[]>([]);
  const activeOrganizationId = ref<string | null>(null);
  const userProfile = ref<UserProfileResponse | null>(null);

  const isInitialized = ref(false);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  let initPromise: Promise<void> | null = null;

  const activeOrganization = computed<OrganizationDetailsDto | null>(() => {
    if (!organizations.value.length) return null;
    return (
      organizations.value.find((org: OrganizationDetailsDto) => org.id === activeOrganizationId.value) ??
      organizations.value[0]
    );
  });

  const userGroup = computed<UserGroup>(() =>
    organizations.value.length > 0 ? "provider" : "buyer"
  );

  const isProvider = computed(() => userGroup.value === "provider");
  const isBuyer = computed(() => userGroup.value === "buyer");

  // Organization verification statuses
  const organizationStatus = computed<OrganizationVerificationStatus | null>(() => {
    if (!isProvider.value || !activeOrganization.value) return null;
    return (activeOrganization.value.status as OrganizationVerificationStatus) ?? "draft";
  });

  const isVerifiedProvider = computed(() => organizationStatus.value === "approved");
  const isPendingVerification = computed(() => organizationStatus.value === "pending");
  const isRevokedVerification = computed(() => organizationStatus.value === "revoked");
  const isRejectedVerification = computed(() => organizationStatus.value === "rejected");
  const isDraftVerification = computed(() => organizationStatus.value === "draft");
  const canPublishProducts = computed(() => isVerifiedProvider.value);

  // Global staff roles (admin/auditor) belong to the account, not the profile
  const accountRole = computed(() => authStore.accountRole);
  const isAdmin = computed(() => authStore.accountRole === "admin");
  const isAuditor = computed(() => authStore.accountRole === "auditor");
  const isStaff = computed(() => isAdmin.value || isAuditor.value);

  // Helper to easily get the display name based on user type
  const displayName = computed(() => {
    if (isProvider.value && activeOrganization.value) {
      return activeOrganization.value.company_name;
    }
    if (userProfile.value) {
      return `${userProfile.value.first_name} ${userProfile.value.last_name}`.trim() || "Usuario";
    }
    return "Usuario";
  });

  async function initialize(forceRefresh = false): Promise<void> {
    if (isInitialized.value && !forceRefresh) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      isLoading.value = true;
      error.value = null;
      try {
        // Fetch both organizations and user profile in parallel
        const [orgs, profile] = await Promise.all([
          organizationApi.getMyOrganizations(),
          userProfileApi.getMyProfile(),
        ]);

        organizations.value = orgs;
        userProfile.value = profile;

        // Auto-select first provider organization as workaround
        activeOrganizationId.value = orgs.length > 0 ? orgs[0].id : null;
      } catch (err: any) {
        error.value = err instanceof Error ? err : new Error(String(err));
        organizations.value = [];
        userProfile.value = null;
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

  // Action to manually update the profile state (useful for the future update form store)
  function updateUserProfile(profile: UserProfileResponse): void {
    userProfile.value = profile;
  }

  function updateActiveOrganization(org: OrganizationDetailsDto): void {
    const idx = organizations.value.findIndex((o: OrganizationDetailsDto) => o.id === org.id);
    if (idx !== -1) {
      organizations.value[idx] = org;
    } else {
      organizations.value.push(org);
    }
    if (!activeOrganizationId.value) {
      activeOrganizationId.value = org.id;
    }
  }

  function setActiveOrganization(orgId: string): void {
    const exists = organizations.value.some((org: OrganizationDetailsDto) => org.id === orgId);
    if (!exists) {
      throw new Error(`Organization ${orgId} not associated with current account.`);
    }
    activeOrganizationId.value = orgId;
  }

  function reset(): void {
    organizations.value = [];
    activeOrganizationId.value = null;
    userProfile.value = null;
    isInitialized.value = false;
    error.value = null;
    initPromise = null;
  }

  return {
    organizations,
    activeOrganizationId,
    activeOrganization,
    userProfile,
    displayName,
    userGroup,
    isProvider,
    isBuyer,
    organizationStatus,
    isVerifiedProvider,
    isPendingVerification,
    isRevokedVerification,
    isRejectedVerification,
    isDraftVerification,
    canPublishProducts,
    accountRole,
    isAdmin,
    isAuditor,
    isStaff,
    isInitialized,
    isLoading,
    error,
    initialize,
    updateUserProfile,
    updateActiveOrganization,
    setActiveOrganization,
    reset,
  };
});

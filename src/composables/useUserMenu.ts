import { ref, computed, onMounted, onBeforeUnmount, watch, type ComponentPublicInstance } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useUserContextStore } from "@/stores/userContextStore";
import { useUserProfileApi } from "@/api/modules/identity/user_profile/useUserProfileApi";

/**
 * Shared state and behaviour for the user menus (navbar + layout sidebar).
 * Centralizes profile loading, dropdown handling, role labels and logout.
 */
export function useUserMenu() {
  const router = useRouter();
  const authStore = useAuthStore();
  const userContext = useUserContextStore();
  const userProfileApi = useUserProfileApi();

  const isDropdownOpen = ref(false);
  const menuRef = ref<HTMLElement | null>(null);
  const avatarBlobId = ref<string | null>(null);
  const userFullName = ref<string>("");
  const isProfileLoading = ref(true);

  const isStaffRole = computed(() => userContext.isStaff);

  const roleBadgeStyle = computed(() => {
    const role = authStore.accountRole;
    if (role === "admin") {
      return "bg-amber-500/10 text-amber-700 border-amber-500/20";
    }
    if (role === "auditor") {
      return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
    }
    return "bg-slate-100 text-slate-600 border-slate-200";
  });

  const roleLabel = computed(() => {
    const role = authStore.accountRole;
    if (!role) return "Usuario";
    const map: Record<string, string> = {
      member: "Miembro",
      admin: "Admin",
      auditor: "Auditor",
    };
    return map[role] ?? role;
  });

  async function fetchUserProfile(): Promise<void> {
    if (!authStore.isAuthenticated) {
      avatarBlobId.value = null;
      userFullName.value = "";
      isProfileLoading.value = false;
      return;
    }

    isProfileLoading.value = true;
    try {
      const profile = await userProfileApi.getMyProfile();
      avatarBlobId.value = profile.avatar_blob_id ?? null;
      userFullName.value = `${profile.first_name} ${profile.last_name}`;
    } catch (err) {
      console.warn("Failed to load user profile in user menu:", err);
    } finally {
      isProfileLoading.value = false;
    }
  }

  function toggleDropdown(): void {
    isDropdownOpen.value = !isDropdownOpen.value;
  }

  function closeDropdown(): void {
    isDropdownOpen.value = false;
  }

  // Function ref so components can bind the menu root without vue-tsc flagging
  // the shared ref as unused (template-only ref bindings aren't counted).
  function setMenuRef(el: Element | ComponentPublicInstance | null): void {
    menuRef.value = el as HTMLElement | null;
  }

  function handleClickOutside(event: MouseEvent): void {
    if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
      closeDropdown();
    }
  }

  async function handleLogout(): Promise<void> {
    closeDropdown();
    await authStore.logout();
    router.push({ name: "login" });
  }

  onMounted(async () => {
    await fetchUserProfile();
    document.addEventListener("click", handleClickOutside);
  });

  onBeforeUnmount(() => {
    document.removeEventListener("click", handleClickOutside);
  });

  watch(
    () => authStore.isAuthenticated,
    async (isAuthenticated) => {
      if (isAuthenticated) {
        await fetchUserProfile();
      } else {
        avatarBlobId.value = null;
        userFullName.value = "";
        isProfileLoading.value = false;
      }
    }
  );

  return {
    isDropdownOpen,
    setMenuRef,
    avatarBlobId,
    userFullName,
    isProfileLoading,
    isStaffRole,
    roleBadgeStyle,
    roleLabel,
    toggleDropdown,
    closeDropdown,
    handleLogout,
  };
}

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/modules/auth";
import { userProfileApi } from "@/api";
import ProfileAvatar from "@/components/profile/ProfileAvatar.vue";

interface Props {
  collapsed?: boolean;
  align?: "left" | "right";
  dropDirection?: "up" | "down";
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: false,
  align: "right",
  dropDirection: "down",
});

const router = useRouter();
const authStore = useAuthStore();
const isDropdownOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);
const avatarBlobId = ref<string | null>(null);
const userFullName = ref<string>("");
const isProfileLoading = ref(true);

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

const fetchUserProfile = async () => {
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
    console.warn("Failed to load user profile in UserMenu:", err);
  } finally {
    isProfileLoading.value = false;
  }
};

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

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const closeDropdown = () => {
  isDropdownOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    closeDropdown();
  }
};

const handleLogout = async () => {
  closeDropdown();
  await authStore.logout();
  router.push({ name: "login" });
};
</script>

<template>
  <div ref="menuRef" class="relative inline-block">
    <!-- Trigger Button -->
    <button
      type="button"
      :class="[
        'flex items-center rounded-full border bg-base-100 transition-all',
        props.collapsed
          ? 'p-1 border-base-300 hover:border-accent hover:shadow-md'
          : 'gap-2 border-base-300 px-3 py-1.5 hover:border-accent hover:shadow-md'
      ]"
      @click.stop="toggleDropdown"
      :aria-expanded="isDropdownOpen"
      aria-haspopup="true"
    >
      <!-- Role Tag - Hidden when collapsed -->
      <span
        v-if="!props.collapsed && authStore.accountRole && authStore.accountRole !== 'member'"
        class="badge badge-accent badge-sm uppercase"
      >
        {{ roleLabel }}
      </span>

      <!-- Skeleton Loaders -->
      <template v-if="isProfileLoading">
        <div v-if="!props.collapsed" class="h-4 w-20 animate-pulse rounded bg-base-200"></div>
        <div class="avatar">
          <div class="w-7 rounded-full bg-base-200"></div>
        </div>
      </template>

      <!-- Actual Content -->
      <template v-else>
        <span
          v-if="!props.collapsed"
          class="hidden max-w-[120px] truncate text-sm font-semibold text-base-content md:inline"
          :title="userFullName"
        >
          {{ userFullName }}
        </span>

        <!-- Avatar (Uses ProfileAvatar for consistent fallback) -->
        <div class="avatar">
          <div class="w-7 rounded-full ring-1 ring-base-200">
            <ProfileAvatar :blob-id="avatarBlobId" :alt="userFullName" />
          </div>
        </div>
      </template>

      <!-- Chevron - Hidden when collapsed -->
      <i
        v-if="!props.collapsed"
        class="fa-solid fa-chevron-down text-xs text-base-content/50 transition-transform duration-200"
        :class="{ 'rotate-180': isDropdownOpen }"
      ></i>
    </button>

    <!-- Dropdown Menu -->
    <transition name="dropdown-fade">
      <div
        v-if="isDropdownOpen"
        class="absolute z-[100] w-60 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
        :class="[
          props.align === 'left' ? 'left-0' : 'right-0',
          props.dropDirection === 'up' ? 'bottom-full mb-2.5' : 'top-full mt-2.5'
        ]"
      >
        <!-- User Identity Header -->
        <div class="flex items-center gap-3 px-4 pt-4 pb-3">
          <!-- Avatar (Uses the exact same ProfileAvatar component for consistent fallback) -->
          <div class="h-10 w-10 shrink-0 overflow-hidden rounded-full">
            <ProfileAvatar :blob-id="avatarBlobId" :alt="userFullName" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold text-[#083c5a]">
              {{ userFullName || "Usuario" }}
            </p>
            <p class="truncate text-xs text-slate-400">
              {{ roleLabel }}
            </p>
          </div>
        </div>

        <!-- Navigation Actions -->
        <div class="px-2 pb-1">
          <router-link
            :to="{ name: 'profile' }"
            class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-[#f0faf9] hover:text-[#189c94]"
            @click="closeDropdown"
          >
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition-colors group-hover:bg-[#e6f7f5] group-hover:text-[#189c94]">
              <i class="fa-regular fa-circle-user text-base"></i>
            </div>
            <span>Mi Perfil</span>
          </router-link>
        </div>

        <!-- Logout Section (visually separated by background, not a line) -->
        <div class="bg-slate-50/70 px-2 py-2">
          <button
            class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-50 hover:text-red-500"
            @click="handleLogout"
          >
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50/80 text-red-300 transition-colors hover:bg-red-100 hover:text-red-500">
              <i class="fa-solid fa-arrow-right-from-bracket text-base"></i>
            </div>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>

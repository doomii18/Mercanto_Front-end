<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
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
const route = useRoute();
const authStore = useAuthStore();

const isDropdownOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);
const avatarBlobId = ref<string | null>(null);
const userFullName = ref<string>("");
const isProfileLoading = ref(true);

const isUnderDashboard = computed(() => route.path.startsWith("/dashboard"));
const isOnProfile = computed(() => route.name === "profile");

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
        'flex items-center rounded-lg border bg-base-100 transition-all',
        props.collapsed
          ? 'p-1 border-base-300 hover:border-accent hover:shadow-sm'
          : 'gap-1.5 border-base-300 px-2 py-1 hover:border-accent hover:shadow-sm'
      ]"
      @click.stop="toggleDropdown"
      :aria-expanded="isDropdownOpen"
      aria-haspopup="true"
    >
      <!-- Role Tag - Hidden when collapsed -->
      <span
        v-if="!props.collapsed && authStore.accountRole && authStore.accountRole !== 'member'"
        class="badge badge-accent badge-xs rounded uppercase"
      >
        {{ roleLabel }}
      </span>

      <!-- Skeleton Loaders -->
      <template v-if="isProfileLoading">
        <div v-if="!props.collapsed" class="h-3.5 w-16 animate-pulse rounded bg-base-200"></div>
        <div class="avatar">
          <div class="w-6 rounded-full bg-base-200"></div>
        </div>
      </template>

      <!-- Actual Content -->
      <template v-else>
        <span
          v-if="!props.collapsed"
          class="hidden max-w-[110px] truncate text-xs font-semibold text-base-content md:inline"
          :title="userFullName"
        >
          {{ userFullName }}
        </span>

        <!-- Trigger Avatar: forced circular -->
        <div class="avatar">
          <div class="w-6 rounded-full ring-1 ring-base-200 overflow-hidden">
            <ProfileAvatar :blob-id="avatarBlobId" :alt="userFullName" />
          </div>
        </div>
      </template>

      <!-- Chevron - Hidden when collapsed -->
      <i
        v-if="!props.collapsed"
        class="fa-solid fa-chevron-down text-[10px] text-base-content/50 transition-transform duration-200"
        :class="{ 'rotate-180': isDropdownOpen }"
      ></i>
    </button>

    <!-- Dropdown Menu -->
    <transition name="dropdown-fade">
      <div
        v-if="isDropdownOpen"
        class="absolute z-[100] w-52 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md"
        :class="[
          props.align === 'left' ? 'left-0' : 'right-0',
          props.dropDirection === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
        ]"
      >
        <!-- User Identity Header -->
        <div class="flex items-center gap-2.5 px-3 py-2 border-b border-slate-100">
          <!-- Dropdown Avatar: forced circular -->
          <div class="h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-100">
            <ProfileAvatar :blob-id="avatarBlobId" :alt="userFullName" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-xs font-bold text-[#083c5a]">
              {{ userFullName || "Usuario" }}
            </p>
            <p class="truncate text-[11px] text-slate-400 leading-tight">
              {{ roleLabel }}
            </p>
          </div>
        </div>

        <!-- Navigation Actions -->
        <div v-if="!isUnderDashboard || !isOnProfile" class="p-1 space-y-0.5">
          <!-- Opción Dashboard -->
          <router-link
            v-if="!isUnderDashboard"
            to="/dashboard"
            class="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            @click="closeDropdown"
          >
            <div class="flex h-6 w-6 items-center justify-center rounded bg-slate-50 text-slate-400">
              <i class="fa-solid fa-gauge-high text-xs"></i>
            </div>
            <span>Ir al Dashboard</span>
          </router-link>

          <!-- Opción Mi Perfil -->
          <router-link
            v-if="!isOnProfile"
            :to="{ name: 'profile' }"
            class="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            @click="closeDropdown"
          >
            <div class="flex h-6 w-6 items-center justify-center rounded bg-slate-50 text-slate-400">
              <i class="fa-regular fa-circle-user text-xs"></i>
            </div>
            <span>Mi Perfil</span>
          </router-link>
        </div>

        <!-- Logout Section -->
        <div class="border-t border-slate-100 p-1 bg-slate-50/50">
          <button
            class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
            @click="handleLogout"
          >
            <div class="flex h-6 w-6 items-center justify-center rounded bg-red-50 text-red-400">
              <i class="fa-solid fa-arrow-right-from-bracket text-xs"></i>
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
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>

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
      <!-- Role Tag (DaisyUI Badge) - Hidden when collapsed -->
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
        <!-- User Name - Hidden when collapsed -->
        <span
          v-if="!props.collapsed"
          class="hidden max-w-[120px] truncate text-sm font-semibold text-base-content md:inline"
          :title="userFullName"
        >
          {{ userFullName }}
        </span>

        <!-- Avatar (DaisyUI Avatar) -->
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

    <!-- Dropdown Menu (DaisyUI Menu) -->
    <transition name="dropdown-fade">
      <ul
        v-if="isDropdownOpen"
        class="menu menu-sm absolute z-[100] w-52 rounded-box border border-base-200 bg-base-100 p-2 shadow-lg"
        :class="[
          props.align === 'left' ? 'left-0' : 'right-0',
          props.dropDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
        ]"
      >
        <li>
          <router-link
            :to="{ name: 'profile' }"
            class="text-base-content hover:bg-base-200"
            @click="closeDropdown"
          >
            <i class="fa-regular fa-circle-user"></i>
            <span>Mi Perfil</span>
          </router-link>
        </li>

        <!-- Divider (DaisyUI Divider) -->
        <div class="divider my-1"></div>

        <li>
          <button
            @click="handleLogout"
            class="text-error hover:bg-error/10"
          >
            <i class="fa-solid fa-arrow-right-from-bracket"></i>
            <span>Cerrar sesión</span>
          </button>
        </li>
      </ul>
    </transition>
  </div>
</template>

<style scoped>
/* Kept minimal: Only used for Vue's <transition> mechanics */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>

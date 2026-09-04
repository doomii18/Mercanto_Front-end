<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/modules/auth";
import { userProfileApi } from "@/api";
import ProfileAvatar from "@/components/profile/ProfileAvatar.vue";

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
  <div ref="menuRef" class="user-menu-container">
    <button
      type="button"
      class="user-profile-badge"
      @click.stop="toggleDropdown"
      :aria-expanded="isDropdownOpen"
      aria-haspopup="true"
    >
      <span class="provider-tag" v-if="authStore.accountRole && authStore.accountRole !== 'member'">
        {{ roleLabel }}
      </span>

      <!-- Skeleton for Name / Avatar while profile is loading -->
      <template v-if="isProfileLoading">
        <div class="h-4 w-20 animate-pulse rounded bg-slate-200"></div>
        <div class="h-7 w-7 animate-pulse rounded-full bg-slate-200"></div>
      </template>

      <template v-else>
        <span class="user-name" :title="userFullName">{{ userFullName }}</span>
        <div class="h-7 w-7 overflow-hidden rounded-full">
          <ProfileAvatar :blob-id="avatarBlobId" :alt="userFullName" />
        </div>
      </template>

      <i
        class="fa-solid fa-chevron-down text-xs text-slate-400 ml-1 transition-transform duration-200"
        :class="{ 'rotate-180': isDropdownOpen }"
      ></i>
    </button>

    <transition name="dropdown-fade">
      <div v-if="isDropdownOpen" class="user-dropdown-menu">
        <router-link
          :to="{ name: 'profile' }"
          class="dropdown-item"
          @click="closeDropdown"
        >
          <i class="fa-regular fa-circle-user"></i>
          <span>Mi Perfil</span>
        </router-link>

        <div class="dropdown-divider"></div>

        <button type="button" class="dropdown-item logout-item" @click="handleLogout">
          <i class="fa-solid fa-arrow-right-from-bracket"></i>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.user-menu-container {
  position: relative;
  display: inline-block;
}

.user-profile-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.85rem;
  background-color: #ffffff;
  border: 1px solid var(--border-gray);
  border-radius: 24px;
  text-decoration: none;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.user-profile-badge:hover {
  border-color: var(--light-teal);
  box-shadow: 0 2px 8px rgba(0, 168, 150, 0.15);
}

.provider-tag {
  background-color: #d8f1ef;
  color: var(--light-teal);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
}

.user-name {
  color: var(--primary-blue);
  font-size: 0.88rem;
  font-weight: 600;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background-color: #ffffff;
  border: 1px solid var(--border-gray);
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  min-width: 180px;
  z-index: 100;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.85rem;
  border-radius: 8px;
  color: var(--primary-blue);
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.dropdown-item i {
  font-size: 1rem;
  width: 18px;
  text-align: center;
  color: #64748b;
}

.dropdown-item:hover {
  background-color: #f1f5f9;
  color: var(--light-teal);
}

.dropdown-item:hover i {
  color: var(--light-teal);
}

.logout-item {
  color: #ef4444;
}

.logout-item i {
  color: #ef4444;
}

.logout-item:hover {
  background-color: #fef2f2;
  color: #dc2626;
}

.logout-item:hover i {
  color: #dc2626;
}

.dropdown-divider {
  height: 1px;
  background-color: var(--border-gray);
  margin: 0.25rem 0;
}

/* Dropdown Transition */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* Hide user name on small screens to save space */
@media (max-width: 768px) {
  .user-name {
    display: none;
  }
}
</style>

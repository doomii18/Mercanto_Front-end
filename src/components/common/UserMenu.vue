<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import ProfileAvatar from "@/components/profile/ProfileAvatar.vue";
import { useUserMenu } from "@/composables/useUserMenu";

const route = useRoute();

const {
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
} = useUserMenu();

const isUnderDashboard = computed(() => route.path.startsWith("/dashboard"));
</script>

<template>
  <div :ref="setMenuRef" class="relative inline-block">
    <!-- Trigger -->
    <button
      type="button"
      class="flex items-center gap-1.5 rounded-lg border border-base-300 bg-base-100 px-2 py-1 transition-all hover:border-accent hover:shadow-sm"
      :aria-expanded="isDropdownOpen"
      aria-haspopup="true"
      @click.stop="toggleDropdown"
    >
      <!-- Role tag (admin / auditor only) -->
      <span
        v-if="isStaffRole"
        :class="[
          'inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
          roleBadgeStyle,
        ]"
      >
        {{ roleLabel }}
      </span>

      <!-- Skeleton -->
      <template v-if="isProfileLoading">
        <div class="h-3.5 w-16 animate-pulse rounded bg-base-200"></div>
        <div class="avatar">
          <div class="w-6 rounded-full bg-base-200"></div>
        </div>
      </template>

      <!-- Content -->
      <template v-else>
        <span
          class="hidden max-w-27.5 truncate text-xs font-semibold text-base-content md:inline"
          :title="userFullName"
        >
          {{ userFullName }}
        </span>
        <div class="avatar">
          <div class="w-6 overflow-hidden rounded-full ring-1 ring-base-200">
            <ProfileAvatar :blob-id="avatarBlobId" :alt="userFullName" />
          </div>
        </div>
      </template>

      <i
        class="fa-solid fa-chevron-down text-[10px] text-base-content/50 transition-transform duration-200"
        :class="{ 'rotate-180': isDropdownOpen }"
      ></i>
    </button>

    <!-- Dropdown -->
    <transition name="user-menu-fade">
      <div
        v-if="isDropdownOpen"
        class="absolute right-0 top-full z-100 mt-1.5 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md"
      >
        <!-- Identity header -->
        <div class="flex items-center gap-2.5 border-b border-slate-100 px-3 py-2">
          <div class="h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-100">
            <ProfileAvatar :blob-id="avatarBlobId" :alt="userFullName" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <p class="truncate text-xs font-bold text-[#083c5a]">{{ userFullName || "Usuario" }}</p>
              <span
                v-if="isStaffRole"
                :class="[
                  'inline-flex shrink-0 items-center rounded border px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider',
                  roleBadgeStyle,
                ]"
              >
                {{ roleLabel }}
              </span>
            </div>
            <p v-if="!isStaffRole" class="truncate text-[11px] leading-tight text-slate-400">
              {{ roleLabel }}
            </p>
          </div>
        </div>

        <!-- Navigation actions -->
        <div v-if="isStaffRole || !isUnderDashboard" class="space-y-0.5 p-1">
          <router-link
            v-if="isStaffRole"
            :to="{ name: 'admin' }"
            class="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            @click="closeDropdown"
          >
            <div class="flex h-6 w-6 items-center justify-center rounded bg-slate-50 text-slate-400">
              <i class="fa-solid fa-shield-halved text-xs"></i>
            </div>
            <span>Panel Administrativo</span>
          </router-link>

          <router-link
            v-if="!isUnderDashboard && !isStaffRole"
            to="/dashboard"
            class="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            @click="closeDropdown"
          >
            <div class="flex h-6 w-6 items-center justify-center rounded bg-slate-50 text-slate-400">
              <i class="fa-solid fa-gauge-high text-xs"></i>
            </div>
            <span>Ir al Dashboard</span>
          </router-link>

          <router-link
            v-if="!isUnderDashboard && isStaffRole"
            to="/dashboard/profile"
            class="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            @click="closeDropdown"
          >
            <div class="flex h-6 w-6 items-center justify-center rounded bg-slate-50 text-slate-400">
              <i class="fa-solid fa-user text-xs"></i>
            </div>
            <span>Mi Perfil</span>
          </router-link>
        </div>

        <!-- Logout -->
        <div class="border-t border-slate-100 bg-slate-50/50 p-1">
          <button
            type="button"
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
.user-menu-fade-enter-active,
.user-menu-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.user-menu-fade-enter-from,
.user-menu-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>

<script setup lang="ts">
import ProfileAvatar from "@/components/profile/ProfileAvatar.vue";
import { useUserMenu } from "@/composables/useUserMenu";

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
</script>

<template>
  <div :ref="setMenuRef" class="relative w-full">
    <!-- Trigger -->
    <button
      type="button"
      class="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2 text-left transition-colors hover:bg-white/10"
      :aria-expanded="isDropdownOpen"
      aria-haspopup="true"
      @click.stop="toggleDropdown"
    >
      <div class="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/10 ring-2 ring-[#00a896]">
        <div v-if="isProfileLoading" class="h-full w-full animate-pulse bg-white/20"></div>
        <ProfileAvatar v-else :blob-id="avatarBlobId" :alt="userFullName" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate text-xs font-bold text-white">{{ userFullName || "Usuario" }}</p>
        <p class="truncate text-[11px] text-slate-300">{{ roleLabel }}</p>
      </div>
      <i
        class="fa-solid fa-chevron-down text-[10px] text-slate-300 transition-transform duration-200"
        :class="{ 'rotate-180': isDropdownOpen }"
      ></i>
    </button>

    <!-- Dropdown -->
    <transition name="admin-user-menu-fade">
      <div
        v-if="isDropdownOpen"
        class="absolute bottom-full left-0 z-100 mb-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
      >
        <!-- Identity header -->
        <div class="flex items-center gap-2.5 border-b border-slate-100 px-3 py-2.5">
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

        <!-- Actions -->
        <div class="p-1">
          <router-link
            to="/dashboard"
            class="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            @click="closeDropdown"
          >
            <div class="flex h-6 w-6 items-center justify-center rounded bg-slate-50 text-slate-400">
              <i class="fa-solid fa-gauge-high text-xs"></i>
            </div>
            <span>Ir al Dashboard</span>
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
.admin-user-menu-fade-enter-active,
.admin-user-menu-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.admin-user-menu-fade-enter-from,
.admin-user-menu-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>

<script setup lang="ts">
import { computed } from "vue";
import ProfileAvatar from "@/components/profile/ProfileAvatar.vue";
import { useUserMenu } from "@/composables/useUserMenu";

const props = withDefaults(defineProps<{ collapsed?: boolean }>(), {
  collapsed: false,
});

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

// Mirrors the sidebar nav item sizing so the trigger aligns with the rail.
const triggerClass = computed(() =>
  props.collapsed
    ? "group relative flex items-center rounded-2xl text-slate-400 transition-all duration-200 hover:bg-[#fde8e4] max-md:h-11 max-md:w-full max-md:justify-start max-md:gap-3.5 max-md:px-3.5 md:mx-auto md:h-11.5 md:w-11.5 md:justify-center"
    : "group relative flex h-11 w-full items-center gap-3.5 rounded-2xl px-3.5 text-slate-400 transition-colors duration-200 hover:bg-[#fde8e4]"
);

// Collapsed (rail): fly out to the right. Expanded: open upward, full width.
const dropdownClass = computed(() =>
  props.collapsed
    ? "absolute bottom-0 left-full z-100 ml-2 w-60"
    : "absolute bottom-full left-0 z-100 mb-2 w-full"
);
</script>

<template>
  <div :ref="setMenuRef" class="relative w-full">
    <!-- Trigger -->
    <button
      type="button"
      :class="triggerClass"
      :aria-expanded="isDropdownOpen"
      aria-haspopup="true"
      @click.stop="toggleDropdown"
    >
      <!-- Avatar -->
      <div
        :class="props.collapsed ? 'h-8 w-8' : 'h-9 w-9'"
        class="shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200"
      >
        <div v-if="isProfileLoading" class="h-full w-full animate-pulse bg-slate-200"></div>
        <ProfileAvatar v-else :blob-id="avatarBlobId" :alt="userFullName" />
      </div>

      <!-- Name + role (expanded only) -->
      <div v-if="!props.collapsed" class="min-w-0 flex-1">
        <p class="truncate text-sm font-semibold text-[#083c5a]">
          {{ userFullName || "Usuario" }}
        </p>
        <p class="truncate text-[11px] text-slate-400">
          {{ roleLabel }}
        </p>
      </div>

      <i
        v-if="!props.collapsed"
        class="fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform duration-200"
        :class="{ 'rotate-180': isDropdownOpen }"
      ></i>

      <!-- Tooltip (collapsed rail only) -->
      <span
        v-if="props.collapsed"
        class="pointer-events-none fixed left-20 z-50 hidden rounded-md bg-[#083c5a] px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 md:inline-block"
      >
        {{ userFullName || "Mi cuenta" }}
      </span>
    </button>

    <!-- Dropdown -->
    <transition name="sidebar-user-menu-fade">
      <div
        v-if="isDropdownOpen"
        :class="dropdownClass"
        class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
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

        <!-- Admin entry (staff only) -->
        <div v-if="isStaffRole" class="p-1">
          <router-link
            :to="{ name: 'admin' }"
            class="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            @click="closeDropdown"
          >
            <div class="flex h-6 w-6 items-center justify-center rounded bg-slate-50 text-slate-400">
              <i class="fa-solid fa-shield-halved text-xs"></i>
            </div>
            <span>Panel Administrativo</span>
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
.sidebar-user-menu-fade-enter-active,
.sidebar-user-menu-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.sidebar-user-menu-fade-enter-from,
.sidebar-user-menu-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>

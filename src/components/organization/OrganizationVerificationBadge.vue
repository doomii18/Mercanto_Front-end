<script setup lang="ts">
import { computed } from "vue";
import { useUserContextStore } from "@/stores/auth";
import type { OrganizationVerificationStatus } from "@/stores/auth/userContextStore";

const props = defineProps<{
  status?: OrganizationVerificationStatus | string | null;
  size?: "sm" | "md" | "lg";
}>();

const userContext = useUserContextStore();

const activeStatus = computed<OrganizationVerificationStatus | null>(() => {
  if (props.status) return props.status as OrganizationVerificationStatus;
  return userContext.organizationStatus;
});

const badgeConfig = computed(() => {
  switch (activeStatus.value) {
    case "approved":
      return {
        label: "Verificado",
        icon: "fa-solid fa-circle-check",
        classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
        iconColor: "text-emerald-500",
      };
    case "pending":
      return {
        label: "En Revisión",
        icon: "fa-solid fa-clock",
        classes: "bg-amber-50 text-amber-800 border-amber-200",
        iconColor: "text-amber-500",
      };
    case "revoked":
      return {
        label: "Suspendido",
        icon: "fa-solid fa-triangle-exclamation",
        classes: "bg-rose-50 text-rose-700 border-rose-200",
        iconColor: "text-rose-500",
      };
    case "rejected":
      return {
        label: "Rechazado",
        icon: "fa-solid fa-circle-xmark",
        classes: "bg-red-50 text-red-700 border-red-200",
        iconColor: "text-red-500",
      };
    case "draft":
    default:
      return {
        label: "Sin Verificar",
        icon: "fa-regular fa-file-lines",
        classes: "bg-slate-100 text-slate-700 border-slate-200",
        iconColor: "text-slate-400",
      };
  }
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case "sm":
      return "text-[11px] px-2 py-0.5 gap-1";
    case "lg":
      return "text-sm px-3.5 py-1.5 gap-2";
    case "md":
    default:
      return "text-xs px-2.5 py-1 gap-1.5";
  }
});
</script>

<template>
  <span
    v-if="activeStatus"
    :class="[
      'inline-flex items-center font-semibold rounded-full border shadow-2xs select-none',
      badgeConfig.classes,
      sizeClasses
    ]"
    :title="`Estado de verificación: ${badgeConfig.label}`"
  >
    <i :class="[badgeConfig.icon, badgeConfig.iconColor]"></i>
    <span>{{ badgeConfig.label }}</span>
  </span>
</template>

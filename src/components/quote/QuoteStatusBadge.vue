<script setup lang="ts">
import { computed } from "vue";
import type { QuoteStatus } from "@/api";

interface StatusConfig {
  label: string;
  badgeClass: string;
  icon: string;
}

const STATUS_MAP: Record<QuoteStatus, StatusConfig> = {
  draft: { label: "Borrador", badgeClass: "bg-slate-100 text-slate-600", icon: "fa-regular fa-file-lines" },
  pending_provider: { label: "Pendiente", badgeClass: "bg-[#fff7ed] text-[#ea580c]", icon: "fa-regular fa-clock" },
  accepted: { label: "Aceptado", badgeClass: "bg-[#eff6ff] text-[#2563eb]", icon: "fa-solid fa-circle-check" },
  paid: { label: "Pagado", badgeClass: "bg-[#f0fdf4] text-[#16a34a]", icon: "fa-solid fa-receipt" },
  fulfilled: { label: "Recibido", badgeClass: "bg-[#d8f1ef] text-[#00a896]", icon: "fa-regular fa-circle-check" },
  rejected: { label: "Rechazado", badgeClass: "bg-[#fef2f2] text-[#dc2626]", icon: "fa-solid fa-circle-xmark" },
  cancelled: { label: "Cancelado", badgeClass: "bg-[#f3f4f6] text-[#6b7280]", icon: "fa-solid fa-ban" },
};

const DEFAULT_CONFIG: StatusConfig = {
  label: "Desconocido",
  badgeClass: "bg-slate-100 text-slate-600",
  icon: "fa-solid fa-circle-info",
};

const props = withDefaults(
  defineProps<{
    status: QuoteStatus | string;
    label?: string;
    size?: "sm" | "md";
  }>(),
  {
    size: "md",
  }
);

const config = computed<StatusConfig>(() => {
  return STATUS_MAP[props.status as QuoteStatus] ?? {
    ...DEFAULT_CONFIG,
    label: props.status,
  };
});
</script>

<template>
  <div
    :class="[
      'inline-flex items-center gap-1.5 rounded-full font-semibold select-none whitespace-nowrap',
      config.badgeClass,
      size === 'sm' ? 'px-3.5 py-1 text-xs' : 'px-4 py-1.5 text-sm'
    ]"
  >
    <i :class="config.icon"></i>
    <span>{{ label || config.label }}</span>
  </div>
</template>

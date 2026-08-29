<script setup lang="ts">
import { computed } from "vue";
import type { QuoteStatus } from "../../api/services/quote/types";

interface StatusConfig {
  label: string;
  className: string;
  icon: string;
}

const STATUS_MAP: Record<QuoteStatus, StatusConfig> = {
  draft: { label: "Borrador", className: "status-draft", icon: "fa-regular fa-file-lines" },
  pending_provider: { label: "Pendiente", className: "status-pending", icon: "fa-regular fa-clock" },
  accepted: { label: "Aceptado", className: "status-accepted", icon: "fa-solid fa-circle-check" },
  paid: { label: "Pagado", className: "status-paid", icon: "fa-solid fa-receipt" },
  fulfilled: { label: "Recibido", className: "status-fulfilled", icon: "fa-regular fa-circle-check" },
  rejected: { label: "Rechazado", className: "status-rejected", icon: "fa-solid fa-circle-xmark" },
  cancelled: { label: "Cancelado", className: "status-cancelled", icon: "fa-solid fa-ban" },
};

const DEFAULT_CONFIG: StatusConfig = {
  label: "Desconocido",
  className: "status-draft",
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
  <div :class="['status-badge', config.className, size]">
    <i :class="config.icon"></i>
    <span>{{ label || config.label }}</span>
  </div>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border-radius: 20px;
  font-weight: 600;
  white-space: nowrap;
  user-select: none;
}

.status-badge.sm {
  padding: 0.3rem 0.85rem;
  font-size: 0.8rem;
}

.status-badge.md {
  padding: 0.4rem 1.15rem;
  font-size: 0.86rem;
}

.status-draft { background-color: #f1f5f9; color: #475569; }
.status-pending { background-color: #fff7ed; color: #ea580c; }
.status-accepted { background-color: #eff6ff; color: #2563eb; }
.status-paid { background-color: #f0fdf4; color: #16a34a; }
.status-fulfilled { background-color: #d8f1ef; color: #00a896; }
.status-rejected { background-color: #fef2f2; color: #dc2626; }
.status-cancelled { background-color: #f3f4f6; color: #6b7280; }
</style>

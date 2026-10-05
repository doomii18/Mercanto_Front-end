<script setup lang="ts">
import { ref, computed } from "vue";

export interface ProviderPaymentItem {
  label: string;
  pct: number;
  color: string;
}

const props = withDefaults(
  defineProps<{
    period?: string;
    totalProviders?: string;
  }>(),
  {
    period: "Este mes",
    totalProviders: "24",
  }
);

// Self-contained mock data (ready to fetch from API)
const paymentStatus = ref<ProviderPaymentItem[]>([
  { label: "Pagados",   pct: 54, color: "#023859" },
  { label: "Por Pagar", pct: 29, color: "#f97316" },
]);

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle - 90));
  const y1 = cy + r * Math.sin(toRad(startAngle - 90));
  const x2 = cx + r * Math.cos(toRad(endAngle - 90));
  const y2 = cy + r * Math.sin(toRad(endAngle - 90));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

const paymentArcs = computed(() => {
  let start = 0;
  return paymentStatus.value.map((p) => {
    const end = start + (p.pct / 100) * 360;
    const arc = describeArc(55, 55, 42, start, end);
    start = end;
    return { ...p, arc };
  });
});
</script>

<template>
  <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-800">Estado de pagos a proveedores</h3>
      <span class="text-[11px] font-semibold text-slate-400">{{ props.period }}</span>
    </div>

    <div class="flex items-center gap-4">
      <!-- SVG Ring small -->
      <div class="shrink-0">
        <svg width="110" height="110" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r="42" fill="white" />
          <path
            v-for="arc in paymentArcs"
            :key="arc.label"
            :d="arc.arc"
            :fill="arc.color"
            stroke="white"
            stroke-width="1.5"
          />
          <circle cx="55" cy="55" r="28" fill="white" />
          <text x="55" y="51" text-anchor="middle" font-size="16" fill="#023859" font-weight="800">{{ props.totalProviders }}</text>
          <text x="55" y="63" text-anchor="middle" font-size="8" fill="#94a3b8">Proveedores</text>
        </svg>
      </div>

      <!-- Legend -->
      <div class="space-y-2.5 flex-1 text-xs">
        <div
          v-for="pay in paymentStatus"
          :key="pay.label"
          class="flex items-center justify-between gap-2"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ background: pay.color }"></span>
            <span class="text-slate-600 text-[11px] truncate">{{ pay.label }}</span>
          </div>
          <span class="font-bold text-slate-700 text-[11px] shrink-0">{{ pay.pct }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

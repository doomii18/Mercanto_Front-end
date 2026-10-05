<script setup lang="ts">
import { ref, computed } from "vue";

export interface OrderStatusItem {
  label: string;
  pct: number;
  color: string;
}

const props = withDefaults(
  defineProps<{
    period?: string;
    totalOrders?: string;
  }>(),
  {
    period: "Este mes",
    totalOrders: "1.245",
  }
);

// Self-contained mock data (ready to fetch from API)
const orderStatus = ref<OrderStatusItem[]>([
  { label: "Entregados", pct: 72, color: "#023859" },
  { label: "En camino",  pct: 14, color: "#00a896" },
  { label: "Cancelados", pct:  9, color: "#f97316" },
  { label: "Pendientes", pct:  5, color: "#e11d48" },
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

const orderArcs = computed(() => {
  let start = 0;
  return orderStatus.value.map((o) => {
    const end = start + (o.pct / 100) * 360;
    const arc = describeArc(75, 75, 55, start, end);
    start = end;
    return { ...o, arc };
  });
});
</script>

<template>
  <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-800">Estado de pedidos</h3>
      <span class="text-[11px] font-semibold text-slate-400">{{ props.period }}</span>
    </div>

    <div class="flex items-center gap-4">
      <!-- SVG Donut -->
      <div class="shrink-0">
        <svg width="150" height="150" viewBox="0 0 150 150">
          <circle cx="75" cy="75" r="55" fill="white" />
          <path
            v-for="arc in orderArcs"
            :key="arc.label"
            :d="arc.arc"
            :fill="arc.color"
            stroke="white"
            stroke-width="1.5"
          />
          <circle cx="75" cy="75" r="36" fill="white" />
          <text x="75" y="71" text-anchor="middle" font-size="17" fill="#023859" font-weight="800">{{ props.totalOrders }}</text>
          <text x="75" y="83" text-anchor="middle" font-size="9" fill="#94a3b8">pedidos</text>
        </svg>
      </div>

      <!-- Legend -->
      <div class="space-y-2.5 flex-1 text-xs">
        <div
          v-for="ord in orderStatus"
          :key="ord.label"
          class="flex items-center justify-between gap-2"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ background: ord.color }"></span>
            <span class="text-slate-600 text-[11px] truncate">{{ ord.label }}</span>
          </div>
          <span class="font-bold text-slate-700 text-[11px] shrink-0">{{ ord.pct }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

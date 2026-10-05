<script setup lang="ts">
import { ref, computed } from "vue";

export interface CategorySalesItem {
  name: string;
  pct: number;
  color: string;
}

const props = withDefaults(
  defineProps<{
    period?: string;
    totalAmount?: string;
  }>(),
  {
    period: "Este mes",
    totalAmount: "412,850",
  }
);

// Self-contained mock data (ready to fetch from API)
const categorySales = ref<CategorySalesItem[]>([
  { name: "Automotriz", pct: 39, color: "#023859" },
  { name: "Maquillaje", pct: 22, color: "#00a896" },
  { name: "Ropa",       pct: 18, color: "#f97316" },
  { name: "Mobiliario", pct: 12, color: "#3b82f6" },
  { name: "Calzado",    pct:  9, color: "#a855f7" },
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

const categoryArcs = computed(() => {
  let start = 0;
  return categorySales.value.map((cat) => {
    const end = start + (cat.pct / 100) * 360;
    const arc = describeArc(70, 70, 55, start, end);
    start = end;
    return { ...cat, arc };
  });
});
</script>

<template>
  <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-800">Ventas por categoría</h3>
      <span class="text-[11px] font-semibold text-slate-400">{{ props.period }}</span>
    </div>

    <div class="flex items-center gap-4">
      <!-- SVG Donut -->
      <div class="shrink-0">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="55" fill="white" />
          <circle cx="70" cy="70" r="35" fill="white" />
          <path
            v-for="arc in categoryArcs"
            :key="arc.name"
            :d="arc.arc"
            :fill="arc.color"
            stroke="white"
            stroke-width="1.5"
          />
          <circle cx="70" cy="70" r="33" fill="white" />
          <text x="70" y="66" text-anchor="middle" class="font-bold" font-size="9" fill="#023859" font-weight="700">C$</text>
          <text x="70" y="77" text-anchor="middle" font-size="10" fill="#023859" font-weight="800">{{ props.totalAmount }}</text>
        </svg>
      </div>

      <!-- Legend -->
      <div class="space-y-2 text-xs flex-1">
        <div
          v-for="cat in categorySales"
          :key="cat.name"
          class="flex items-center justify-between gap-2"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span class="h-2.5 w-2.5 shrink-0 rounded-sm" :style="{ background: cat.color }"></span>
            <span class="text-slate-600 truncate text-[11px]">{{ cat.name }}</span>
          </div>
          <span class="font-bold text-slate-700 text-[11px] shrink-0">{{ cat.pct }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

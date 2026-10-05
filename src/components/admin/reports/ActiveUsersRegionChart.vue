<script setup lang="ts">
import { ref, computed } from "vue";

export interface RegionActiveUserItem {
  name: string;
  pct: number;
  color: string;
}

const props = withDefaults(
  defineProps<{
    period?: string;
    totalUsers?: string;
  }>(),
  {
    period: "Este mes",
    totalUsers: "561",
  }
);

// Self-contained mock data (ready to fetch from API)
const regionData = ref<RegionActiveUserItem[]>([
  { name: "Pacífico",  pct: 38, color: "#023859" },
  { name: "Norte",     pct: 32, color: "#00a896" },
  { name: "Centro",    pct: 17, color: "#f97316" },
  { name: "Atlántico", pct: 13, color: "#a855f7" },
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

const regionArcs = computed(() => {
  let start = 0;
  return regionData.value.map((r) => {
    const end = start + (r.pct / 100) * 360;
    const arc = describeArc(65, 65, 50, start, end);
    start = end;
    return { ...r, arc };
  });
});
</script>

<template>
  <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-800">Usuarios activos por región</h3>
      <span class="text-[11px] font-semibold text-slate-400">{{ props.period }}</span>
    </div>

    <div class="flex items-center gap-4">
      <!-- SVG Ring -->
      <div class="shrink-0">
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r="50" fill="white" />
          <path
            v-for="arc in regionArcs"
            :key="arc.name"
            :d="arc.arc"
            :fill="arc.color"
            stroke="white"
            stroke-width="1.5"
          />
          <circle cx="65" cy="65" r="33" fill="white" />
          <text x="65" y="62" text-anchor="middle" font-size="18" fill="#023859" font-weight="800">{{ props.totalUsers }}</text>
          <text x="65" y="76" text-anchor="middle" font-size="9" fill="#94a3b8">usuarios</text>
        </svg>
      </div>

      <!-- Legend -->
      <div class="space-y-2 flex-1 text-xs">
        <div
          v-for="region in regionData"
          :key="region.name"
          class="flex items-center justify-between gap-2"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ background: region.color }"></span>
            <span class="text-slate-600 text-[11px] truncate">{{ region.name }}</span>
          </div>
          <span class="font-bold text-slate-700 text-[11px] shrink-0">{{ region.pct }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
} from "reka-ui";

// ─── Date Range ────────────────────────────────────────────────────────────────
const dateFrom = ref("01/09/2024");
const dateTo   = ref("30/09/2024");

// ─── Export Controls ───────────────────────────────────────────────────────────
const reportType   = ref("Recargas");
const exportFormat = ref("Excel (.xlsx)");

const REPORT_TYPES  = ["Recargas", "Productos populares", "Ventas"] as const;
const EXPORT_FORMATS = ["Excel (.xlsx)", "CSV (.csv)", "PDF (.pdf)"] as const;

function handleGenerateReport() {
  // Mock action - would call real API in production
  alert(`Generando reporte de "${reportType.value}" en formato ${exportFormat.value}...`);
}

// ─── KPI Cards ────────────────────────────────────────────────────────────────
const kpiCards = ref([
  {
    label: "Ventas totales",
    period: "Este mes",
    value: "C$ 412,850",
    change: "+8%",
    changeLabel: "vs. mes anterior",
    positive: true,
  },
  {
    label: "Pedidos totales",
    period: "Este mes",
    value: "1,245",
    change: "+5%",
    changeLabel: "vs. mes anterior",
    positive: true,
  },
  {
    label: "Proveedores activos",
    period: "Este mes",
    value: "24",
    change: "+10%",
    changeLabel: "vs. mes anterior",
    positive: true,
  },
  {
    label: "Compradores activos",
    period: "Este mes",
    value: "537",
    change: "-3%",
    changeLabel: "vs. mes anterior",
    positive: false,
  },
  {
    label: "Comisiones (2.5)",
    period: "Este mes",
    value: "C$ 10,821",
    change: "+8%",
    changeLabel: "vs. mes anterior",
    positive: true,
  },
]);

// ─── Ventas por Categoría (Donut Chart Mock) ──────────────────────────────────
const categorySales = ref([
  { name: "Automotriz", pct: 39, color: "#023859" },
  { name: "Maquillaje", pct: 22, color: "#00a896" },
  { name: "Ropa",       pct: 18, color: "#f97316" },
  { name: "Mobiliario", pct: 12, color: "#3b82f6" },
  { name: "Calzado",    pct:  9, color: "#a855f7" },
]);

// Compute SVG donut arcs
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

// ─── Recargas por Banco (Bar Chart Mock) ──────────────────────────────────────
const bankData = ref([
  { bank: "BDF",    amount: "C$2.3M", value: 100, color: "#023859" },
  { bank: "BAC",    amount: "C$1.8M", value:  78, color: "#00a896" },
  { bank: "Bangro", amount: "C$900K", value:  39, color: "#f97316" },
  { bank: "LAFISE", amount: "C$720K", value:  31, color: "#3b82f6" },
  { bank: "Ficohsa",amount: "C$540K", value:  23, color: "#a855f7" },
]);

// ─── Usuarios Activos por Región (Ring) ───────────────────────────────────────
const regionData = ref([
  { name: "Pacífico",  pct: 38, color: "#023859" },
  { name: "Norte",     pct: 32, color: "#00a896" },
  { name: "Centro",    pct: 17, color: "#f97316" },
  { name: "Atlántico", pct: 13, color: "#a855f7" },
]);

const regionArcs = computed(() => {
  let start = 0;
  return regionData.value.map((r) => {
    const end = start + (r.pct / 100) * 360;
    const arc = describeArc(65, 65, 50, start, end);
    start = end;
    return { ...r, arc };
  });
});

// ─── Top 5 Proveedores ────────────────────────────────────────────────────────
const topProviders = ref([
  { rank: 1, name: "Distribuidora Comisigo S.A.", category: "Alimentos",      sales: "C$ 82,450", orders: 86, rankColor: "bg-[#023859] text-white" },
  { rank: 2, name: "Licores Castillo",             category: "Bebidas",        sales: "C$ 62,300", orders: 54, rankColor: "bg-[#00a896] text-white" },
  { rank: 3, name: "Importaciones Olam C.A.",      category: "Higiene y limpieza", sales: "C$ 38,900", orders: 39, rankColor: "bg-[#f97316] text-white" },
  { rank: 4, name: "Importaciones Olam C.A.",      category: "Higiene y limpieza", sales: "C$ 38,900", orders: 39, rankColor: "bg-slate-300 text-slate-700" },
]);

// ─── Estado de Pedidos ────────────────────────────────────────────────────────
const orderStatus = ref([
  { label: "Entregados", pct: 72, color: "#023859" },
  { label: "En camino",  pct: 14, color: "#00a896" },
  { label: "Cancelados", pct:  9, color: "#f97316" },
  { label: "Pendientes", pct:  5, color: "#e11d48" },
]);

const orderArcs = computed(() => {
  let start = 0;
  return orderStatus.value.map((o) => {
    const end = start + (o.pct / 100) * 360;
    const arc = describeArc(75, 75, 55, start, end);
    start = end;
    return { ...o, arc };
  });
});

// ─── Estado de Pagos ──────────────────────────────────────────────────────────
const paymentStatus = ref([
  { label: "Pagados",   pct: 54, color: "#023859" },
  { label: "Por Pagar", pct: 29, color: "#f97316" },
]);

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
  <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">

    <!-- ── Page Header ─────────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-[#023859]">Reportes</h1>
        <p class="text-xs sm:text-sm text-slate-400 mt-0.5">
          Visualiza el rendimiento de la plataforma y exporta reportes detallados
        </p>
      </div>

      <!-- Date Range Indicator -->
      <div class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-2xs self-start sm:self-auto">
        <i class="fa-regular fa-calendar-days text-slate-400 text-xs"></i>
        <span>{{ dateFrom }} – {{ dateTo }}</span>
      </div>
    </div>

    <!-- ── KPI Cards Row ───────────────────────────────────────────────────── -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <div
        v-for="kpi in kpiCards"
        :key="kpi.label"
        class="rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs space-y-1"
      >
        <div class="flex items-start justify-between">
          <p class="text-[11px] font-medium text-slate-500 leading-tight">{{ kpi.label }}</p>
          <span class="text-[10px] font-semibold text-slate-400 whitespace-nowrap">{{ kpi.period }}</span>
        </div>
        <p class="text-lg sm:text-xl font-bold text-[#023859] leading-tight">{{ kpi.value }}</p>
        <div class="flex items-center gap-1 text-[11px] font-semibold"
          :class="kpi.positive ? 'text-[#00a896]' : 'text-red-500'">
          <i :class="kpi.positive ? 'fa-solid fa-arrow-trend-up' : 'fa-solid fa-arrow-trend-down'" class="text-[10px]"></i>
          <span>{{ kpi.change }} {{ kpi.changeLabel }}</span>
        </div>
      </div>
    </div>

    <!-- ── Charts Row 1 ────────────────────────────────────────────────────── -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

      <!-- Ventas por Categoría (Donut) -->
      <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-800">Ventas por categoría</h3>
          <span class="text-[11px] font-semibold text-slate-400">Este mes</span>
        </div>

        <div class="flex items-center gap-4">
          <!-- SVG Donut -->
          <div class="shrink-0">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="55" fill="white" />
              <!-- Ring cutout -->
              <circle cx="70" cy="70" r="35" fill="white" />
              <!-- Arcs -->
              <path
                v-for="arc in categoryArcs"
                :key="arc.name"
                :d="arc.arc"
                :fill="arc.color"
                stroke="white"
                stroke-width="1.5"
              />
              <!-- Inner ring cutout -->
              <circle cx="70" cy="70" r="33" fill="white" />
              <!-- Center text -->
              <text x="70" y="66" text-anchor="middle" class="font-bold" font-size="9" fill="#023859" font-weight="700">C$</text>
              <text x="70" y="77" text-anchor="middle" font-size="10" fill="#023859" font-weight="800">412,850</text>
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

      <!-- Recargas por Banco (Bar Chart) -->
      <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-800">Recargas por banco</h3>
          <span class="text-[11px] font-semibold text-slate-400">Este mes</span>
        </div>

        <!-- Bar Chart -->
        <div class="flex items-end gap-3 justify-around h-40 pt-4">
          <div
            v-for="bar in bankData"
            :key="bar.bank"
            class="flex flex-col items-center gap-1.5 flex-1"
          >
            <span class="text-[10px] font-bold text-slate-600 whitespace-nowrap">{{ bar.amount }}</span>
            <div
              class="w-full rounded-t-lg transition-all duration-500"
              :style="{ height: `${(bar.value / 100) * 100}px`, background: bar.color }"
            ></div>
            <span class="text-[10px] font-semibold text-slate-500">{{ bar.bank }}</span>
          </div>
        </div>
      </div>

      <!-- Usuarios Activos por Región (Ring) -->
      <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-800">Usuarios activos por región</h3>
          <span class="text-[11px] font-semibold text-slate-400">Este mes</span>
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
              <text x="65" y="62" text-anchor="middle" font-size="18" fill="#023859" font-weight="800">561</text>
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
    </div>

    <!-- ── Charts Row 2 ────────────────────────────────────────────────────── -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

      <!-- Top 5 Proveedores -->
      <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-800">Top 5 proveedores por ventas</h3>
          <span class="text-[11px] font-semibold text-slate-400">Este mes</span>
        </div>

        <div class="text-[10px] font-semibold text-slate-400 grid grid-cols-12 gap-2 px-1">
          <span class="col-span-1">#</span>
          <span class="col-span-6">Proveedor</span>
          <span class="col-span-3 text-right">Ventas (C$)</span>
          <span class="col-span-2 text-right">Pedidos</span>
        </div>

        <div class="space-y-2">
          <div
            v-for="prov in topProviders"
            :key="prov.rank"
            class="grid grid-cols-12 gap-2 items-center px-1 py-2 rounded-xl hover:bg-slate-50/70 transition-colors"
          >
            <div class="col-span-1">
              <span
                :class="['flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold', prov.rankColor]"
              >
                {{ prov.rank }}
              </span>
            </div>

            <div class="col-span-6 min-w-0">
              <p class="text-xs font-bold text-slate-800 truncate leading-tight">{{ prov.name }}</p>
              <p class="text-[10px] text-slate-400 truncate">{{ prov.category }}</p>
            </div>

            <p class="col-span-3 text-right text-xs font-bold text-[#023859]">{{ prov.sales }}</p>
            <p class="col-span-2 text-right text-xs font-semibold text-slate-500">{{ prov.orders }}</p>
          </div>
        </div>
      </div>

      <!-- Estado de Pedidos (Donut) -->
      <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-800">Estado de pedidos</h3>
          <span class="text-[11px] font-semibold text-slate-400">Este mes</span>
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
              <text x="75" y="71" text-anchor="middle" font-size="17" fill="#023859" font-weight="800">1.245</text>
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

      <!-- Estado de Pagos a Proveedores (Small Ring) -->
      <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-800">Estado de pagos a proveedores</h3>
          <span class="text-[11px] font-semibold text-slate-400">Este mes</span>
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
              <text x="55" y="51" text-anchor="middle" font-size="16" fill="#023859" font-weight="800">24</text>
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
    </div>

    <!-- ── Export Section ──────────────────────────────────────────────────── -->
    <div class="rounded-2xl border-2 border-[#f97316] bg-white p-4 sm:p-5 shadow-xs">
      <!-- Row 1: Icon + Title -->
      <div class="flex items-start gap-3 mb-4">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#f97316] mt-0.5">
          <i class="fa-solid fa-file-arrow-down text-base"></i>
        </div>
        <div>
          <h3 class="text-sm font-bold text-slate-800">Exportar reportes</h3>
          <p class="text-[11px] text-slate-400 mt-0.5">
            Selecciona la rango de fechas, categoría, rango de fechas y formato
          </p>
        </div>
      </div>

      <!-- Row 2: Controls -->
      <div class="flex flex-wrap items-center gap-3">

        <!-- Date From -->
        <div class="relative">
          <i class="fa-regular fa-calendar-days absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
          <input
            v-model="dateFrom"
            type="text"
            class="rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs font-semibold text-slate-700 shadow-2xs focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 w-36"
          />
        </div>

        <span class="text-slate-400 font-semibold text-xs">–</span>

        <!-- Date To -->
        <div class="relative">
          <i class="fa-regular fa-calendar-days absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
          <input
            v-model="dateTo"
            type="text"
            class="rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs font-semibold text-slate-700 shadow-2xs focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 w-36"
          />
        </div>

        <!-- Export Format (Reka Select) -->
        <SelectRoot v-model="exportFormat">
          <SelectTrigger
            class="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 cursor-pointer min-w-[130px] justify-between"
          >
            <SelectValue />
            <SelectIcon>
              <i class="fa-solid fa-chevron-down text-[10px] text-slate-400"></i>
            </SelectIcon>
          </SelectTrigger>

          <SelectPortal>
            <SelectContent
              position="popper"
              :side-offset="5"
              class="z-50 min-w-[160px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-xl"
            >
              <SelectViewport class="p-1 space-y-0.5">
                <SelectItem
                  v-for="fmt in EXPORT_FORMATS"
                  :key="fmt"
                  :value="fmt"
                  class="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 font-medium text-slate-700 outline-none hover:bg-slate-100 data-[highlighted]:bg-[#00a896]/10 data-[highlighted]:text-[#023859]"
                >
                  <SelectItemText>{{ fmt }}</SelectItemText>
                  <SelectItemIndicator class="ml-auto text-[#00a896]">
                    <i class="fa-solid fa-check text-xs"></i>
                  </SelectItemIndicator>
                </SelectItem>
              </SelectViewport>
            </SelectContent>
          </SelectPortal>
        </SelectRoot>

        <!-- Tipo de Reporte (Reka Select) — 3 opciones -->
        <SelectRoot v-model="reportType">
          <SelectTrigger
            class="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 cursor-pointer min-w-[180px] justify-between"
          >
            <span class="text-slate-400 font-normal">Tipo de reporte:</span>
            <SelectValue />
            <SelectIcon>
              <i class="fa-solid fa-chevron-down text-[10px] text-slate-400"></i>
            </SelectIcon>
          </SelectTrigger>

          <SelectPortal>
            <SelectContent
              position="popper"
              :side-offset="5"
              class="z-50 min-w-[200px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-xl"
            >
              <SelectViewport class="p-1 space-y-0.5">
                <SelectItem
                  v-for="rt in REPORT_TYPES"
                  :key="rt"
                  :value="rt"
                  class="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 font-medium text-slate-700 outline-none hover:bg-slate-100 data-[highlighted]:bg-[#00a896]/10 data-[highlighted]:text-[#023859]"
                >
                  <SelectItemText>{{ rt }}</SelectItemText>
                  <SelectItemIndicator class="ml-auto text-[#00a896]">
                    <i class="fa-solid fa-check text-xs"></i>
                  </SelectItemIndicator>
                </SelectItem>
              </SelectViewport>
            </SelectContent>
          </SelectPortal>
        </SelectRoot>

        <!-- Generate Button -->
        <button
          type="button"
          @click="handleGenerateReport"
          class="inline-flex items-center gap-2 rounded-xl bg-[#023859] hover:bg-[#012a44] px-5 py-2 text-xs font-bold text-white shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          <i class="fa-solid fa-cloud-arrow-down text-sm"></i>
          <span>Generar Reporte</span>
        </button>
      </div>
    </div>

  </div>
</template>

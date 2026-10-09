<script setup lang="ts">
import { ref } from "vue";
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemIndicator,
} from "reka-ui";
import { useAnalyticsApi } from "@/api/modules/analytics/useAnalyticsApi";
import { useToastStore } from "@/stores/ui";

const toastStore = useToastStore();
const analyticsApi = useAnalyticsApi();

const dateFrom = ref("01/09/2026");
const dateTo = ref("30/09/2026");
const reportType = ref("Recargas");
const exportFormat = ref("CSV (.csv)");

const REPORT_TYPES = ["Recargas", "Productos populares", "Ventas"] as const;
const EXPORT_FORMATS = ["CSV (.csv)", "Excel (.xlsx)", "PDF (.pdf)"] as const;
const isGenerating = ref(false);

const emit = defineEmits<{
  (e: "generate", payload: { dateFrom: string; dateTo: string; reportType: string; exportFormat: string }): void;
}>();

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function handleGenerateReport() {
  emit("generate", {
    dateFrom: dateFrom.value,
    dateTo: dateTo.value,
    reportType: reportType.value,
    exportFormat: exportFormat.value,
  });

  isGenerating.value = true;
  try {
    if (reportType.value === "Recargas") {
      const data = await analyticsApi.getBankRecharges();
      let csv = "Banco,Monto Total (NIO),Transacciones,Porcentaje\n";
      for (const item of data.banks) {
        csv += `"${item.bank_name}",${item.total_amount},${item.recharge_count},${item.percentage}%\n`;
      }
      csv += `\nTotal Consolidado,${data.total_recharged_amount},,100%\n`;
      downloadBlob(csv, `reporte_recargas_${Date.now()}.csv`, "text/csv;charset=utf-8;");
    } else if (reportType.value === "Productos populares") {
      const data = await analyticsApi.getCategorySales();
      let csv = "Categoria,Monto Vendido (NIO),Cantidad Pedidos,Porcentaje\n";
      for (const item of data.categories) {
        csv += `"${item.category_name}",${item.total_amount},${item.order_items_count},${item.percentage}%\n`;
      }
      csv += `\nTotal Ventas Categorias,${data.period_total_amount},,100%\n`;
      downloadBlob(csv, `reporte_categorias_${Date.now()}.csv`, "text/csv;charset=utf-8;");
    } else {
      const [kpi, orders] = await Promise.all([
        analyticsApi.getKpiMetrics(),
        analyticsApi.getOrderStatusDistribution(),
      ]);
      let csv = "Metrica,Valor Actual,Valor Previo,Cambio (%)\n";
      csv += `Ventas Totales (NIO),${kpi.sales.current_value},${kpi.sales.previous_value},${kpi.sales.percentage_change}%\n`;
      csv += `Total Pedidos,${kpi.orders.current_value},${kpi.orders.previous_value},${kpi.orders.percentage_change}%\n`;
      csv += `Proveedores Activos,${kpi.active_providers.current_value},${kpi.active_providers.previous_value},${kpi.active_providers.percentage_change}%\n`;
      csv += `Compradores Activos,${kpi.active_buyers.current_value},${kpi.active_buyers.previous_value},${kpi.active_buyers.percentage_change}%\n`;
      csv += `Comisiones Plataforma (NIO),${kpi.commissions.current_value},${kpi.commissions.previous_value},${kpi.commissions.percentage_change}%\n\n`;
      csv += "Estado de Pedido,Cantidad,Porcentaje\n";
      for (const item of orders.breakdown) {
        csv += `"${item.status_group}",${item.order_count},${item.percentage}%\n`;
      }
      downloadBlob(csv, `reporte_ventas_${Date.now()}.csv`, "text/csv;charset=utf-8;");
    }

    toastStore.addToast({
      title: "Reporte generado",
      message: `El reporte de ${reportType.value} ha sido descargado exitosamente.`,
      variant: "success",
    });
  } catch (err: any) {
    console.error("Failed to export report:", err);
    toastStore.addToast({
      title: "Error al exportar",
      message: "No se pudieron obtener las métricas para generar el reporte.",
      variant: "error",
    });
  } finally {
    isGenerating.value = false;
  }
}
</script>

<template>
  <div class="rounded-2xl border-2 border-[#f97316] bg-white p-4 sm:p-5 shadow-xs">
    <!-- Row 1: Icon + Title -->
    <div class="flex items-start gap-3 mb-4">
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-secondary mt-0.5">
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
          class="rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs font-semibold text-slate-700 shadow-2xs focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 w-36"
        />
      </div>

      <span class="text-slate-400 font-semibold text-xs">–</span>

      <!-- Date To -->
      <div class="relative">
        <i class="fa-regular fa-calendar-days absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
        <input
          v-model="dateTo"
          type="text"
          class="rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs font-semibold text-slate-700 shadow-2xs focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 w-36"
        />
      </div>

      <!-- Export Format (Reka Select) -->
      <SelectRoot v-model="exportFormat">
        <SelectTrigger
          class="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 cursor-pointer min-w-[130px] justify-between"
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
                class="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 font-medium text-slate-700 outline-none hover:bg-slate-100 data-[highlighted]:bg-accent/10 data-[highlighted]:text-primary"
              >
                <SelectItemText>{{ fmt }}</SelectItemText>
                <SelectItemIndicator class="ml-auto text-accent">
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
          class="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 cursor-pointer min-w-[180px] justify-between"
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
                class="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 font-medium text-slate-700 outline-none hover:bg-slate-100 data-[highlighted]:bg-accent/10 data-[highlighted]:text-primary"
              >
                <SelectItemText>{{ rt }}</SelectItemText>
                <SelectItemIndicator class="ml-auto text-accent">
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
        class="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 px-5 py-2 text-xs font-bold text-white shadow-sm active:scale-95 transition-all cursor-pointer"
      >
        <i class="fa-solid fa-cloud-arrow-down text-sm"></i>
        <span>Generar Reporte</span>
      </button>
    </div>
  </div>
</template>

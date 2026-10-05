<script setup lang="ts">
import { ref } from "vue";
import ReportKpiStats from "@/components/admin/reports/ReportKpiStats.vue";
import CategorySalesChart from "@/components/admin/reports/CategorySalesChart.vue";
import BankRechargesChart from "@/components/admin/reports/BankRechargesChart.vue";
import ActiveUsersRegionChart from "@/components/admin/reports/ActiveUsersRegionChart.vue";
import TopProvidersCard from "@/components/admin/reports/TopProvidersCard.vue";
import OrderStatusChart from "@/components/admin/reports/OrderStatusChart.vue";
import ProviderPaymentStatusChart from "@/components/admin/reports/ProviderPaymentStatusChart.vue";
import ReportExportSection from "@/components/admin/reports/ReportExportSection.vue";

const dateFrom = ref("01/09/2024");
const dateTo = ref("30/09/2024");
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
    <!-- ── Page Header ─────────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Reportes</h1>
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
    <ReportKpiStats />

    <!-- ── Charts Row 1 ────────────────────────────────────────────────────── -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <CategorySalesChart />
      <BankRechargesChart />
      <ActiveUsersRegionChart />
    </div>

    <!-- ── Charts Row 2 ────────────────────────────────────────────────────── -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <TopProvidersCard />
      <OrderStatusChart />
      <ProviderPaymentStatusChart />
    </div>

    <!-- ── Export Section ──────────────────────────────────────────────────── -->
    <ReportExportSection />
  </div>
</template>

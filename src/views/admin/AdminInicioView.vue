<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

const stats = [
  {
    label: "Recargas pendientes",
    value: "24",
    amount: "C$ 48,500.00",
    icon: "fa-regular fa-clock text-[#f97316]",
    iconBg: "bg-orange-50",
    amountColor: "text-[#f97316]",
  },
  {
    label: "Aprobadas hoy",
    value: "37",
    amount: "C$ 63,300.00",
    icon: "fa-regular fa-circle-check text-[#00a896]",
    iconBg: "bg-teal-50",
    amountColor: "text-[#00a896]",
  },
  {
    label: "Rechazadas hoy",
    value: "5",
    amount: "C$ 8,700.00",
    icon: "fa-solid fa-triangle-exclamation text-[#f97316]",
    iconBg: "bg-orange-50",
    amountColor: "text-[#f97316]",
  },
  {
    label: "Total de movimientos",
    value: "42",
    amount: "C$ 112,350.00",
    icon: "fa-solid fa-chart-line text-[#023859]",
    iconBg: "bg-slate-100",
    amountColor: "text-[#023859]",
  },
];

const solicitudes = [
  {
    id: "REC-000245",
    usuario: "María López Vasquez",
    monto: "C$ 2,000.00",
    banco: "Banco Lafise",
    fecha: "Hoy, 05:25 PM",
    estado: "Pendiente",
    badgeStyle: "bg-orange-100/70 text-[#ea580c]",
  },
  {
    id: "REC-000244",
    usuario: "Juan José Pérez",
    monto: "C$ 1,500.00",
    banco: "BAC Credomatic",
    fecha: "Hoy, 03:10 PM",
    estado: "Aprobada",
    badgeStyle: "bg-teal-100/70 text-[#00a896]",
  },
  {
    id: "REC-000243",
    usuario: "Laura Gómez Blandón",
    monto: "C$ 5,000.00",
    banco: "Banpro",
    fecha: "Hoy, 01:15 PM",
    estado: "Pendiente",
    badgeStyle: "bg-orange-100/70 text-[#ea580c]",
  },
  {
    id: "REC-000242",
    usuario: "Wendy Solórzano",
    monto: "C$ 850.00",
    banco: "Banco Lafise",
    fecha: "Ayer, 06:40 PM",
    estado: "Rechazada",
    badgeStyle: "bg-slate-200 text-slate-700",
  },
  {
    id: "REC-000241",
    usuario: "Alina Rostrán",
    monto: "C$ 12,000.00",
    banco: "BAC Credomatic",
    fecha: "Ayer, 11:20 AM",
    estado: "Aprobada",
    badgeStyle: "bg-teal-100/70 text-[#00a896]",
  },
];

const navigateToDetail = (id: string) => {
  router.push({ name: "admin-solicitud-detalle", params: { id } });
};
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
    <!-- Header Title & Date -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="font-serif text-2xl sm:text-3xl font-bold text-[#023859]">
          Hola, Admin
        </h1>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">
          Bienvenido de vuelta. Aquí está el resumen de las operaciones de hoy.
        </p>
      </div>

      <!-- Date Badge -->
      <div class="self-start sm:self-auto flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-2xs">
        <i class="fa-regular fa-calendar-days text-slate-400"></i>
        <span>17 de Septiembre, 2026</span>
      </div>
    </div>

    <!-- 4 Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-shadow hover:shadow-md flex justify-between items-start"
      >
        <div class="space-y-1">
          <p class="text-xs font-medium text-slate-400">{{ stat.label }}</p>
          <p class="text-2xl font-bold font-serif text-[#023859] leading-none pt-1">{{ stat.value }}</p>
          <p :class="['text-xs font-bold pt-1', stat.amountColor]">{{ stat.amount }}</p>
        </div>
        <div :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg', stat.iconBg]">
          <i :class="stat.icon"></i>
        </div>
      </div>
    </div>

    <!-- Solicitudes de recarga recientes Card -->
    <div class="rounded-2xl border border-slate-100 bg-white shadow-xs overflow-hidden">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5 border-b border-slate-100">
        <h3 class="font-serif text-lg font-bold text-[#023859]">
          Solicitudes de recarga recientes
        </h3>
        <router-link
          :to="{ name: 'admin-pagos' }"
          class="text-xs font-bold text-[#00a896] hover:underline"
        >
          Ver todas las solicitudes
        </router-link>
      </div>

      <!-- Table container with responsive overflow -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[680px]">
          <thead>
            <tr class="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
              <th class="px-6 py-3.5">ID Solicitud</th>
              <th class="px-6 py-3.5">Usuario</th>
              <th class="px-6 py-3.5">Monto</th>
              <th class="px-6 py-3.5">Banco</th>
              <th class="px-6 py-3.5">Fecha</th>
              <th class="px-6 py-3.5">Estado</th>
              <th class="px-6 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="sol in solicitudes"
              :key="sol.id"
              class="hover:bg-slate-50/60 transition-colors"
            >
              <td class="px-6 py-4 font-bold text-xs text-[#023859] font-mono">
                {{ sol.id }}
              </td>
              <td class="px-6 py-4 font-bold text-xs text-[#023859]">
                {{ sol.usuario }}
              </td>
              <td class="px-6 py-4 font-bold text-xs text-[#023859]">
                {{ sol.monto }}
              </td>
              <td class="px-6 py-4 text-xs text-slate-500">
                {{ sol.banco }}
              </td>
              <td class="px-6 py-4 text-xs text-slate-400">
                {{ sol.fecha }}
              </td>
              <td class="px-6 py-4">
                <span :class="['inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-bold', sol.badgeStyle]">
                  {{ sol.estado }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  @click="navigateToDetail(sol.id)"
                  class="text-xs font-bold text-[#00a896] hover:underline"
                >
                  Revisar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

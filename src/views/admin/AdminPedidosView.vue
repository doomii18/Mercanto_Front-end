<script setup lang="ts">
import { ref } from "vue";

const pedidos = ref([
  { id: "ORD-9482", comprador: "María López Vasquez", proveedor: "E. Chamorro S.A", monto: "C$ 18,500.00", items: 3, fecha: "17 Sep 2026", estado: "Entregado", badgeStyle: "bg-teal-100/70 text-[#00a896]" },
  { id: "ORD-9481", comprador: "Juan José Pérez", proveedor: "Dicegsa", monto: "C$ 9,750.00", items: 1, fecha: "16 Sep 2026", estado: "En camino", badgeStyle: "bg-blue-100/70 text-blue-700" },
  { id: "ORD-9480", comprador: "Laura Gómez Blandón", proveedor: "Distribuidora Don Wendy", monto: "C$ 3,200.00", items: 5, fecha: "15 Sep 2026", estado: "Pendiente", badgeStyle: "bg-orange-100/70 text-[#ea580c]" },
  { id: "ORD-9479", comprador: "Wendy Solórzano", proveedor: "Dicegsa", monto: "C$ 1,200.00", items: 2, fecha: "14 Sep 2026", estado: "Cancelado", badgeStyle: "bg-slate-200 text-slate-700" },
]);
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
    <div>
      <h1 class="font-serif text-2xl sm:text-3xl font-bold text-[#023859]">
        Pedidos registrados
      </h1>
      <p class="text-xs sm:text-sm text-slate-400 mt-1">
        Monitorea los pedidos realizados entre compradores y proveedores.
      </p>
    </div>

    <!-- Table -->
    <div class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[680px]">
          <thead>
            <tr class="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
              <th class="px-6 py-3.5">ID Pedido</th>
              <th class="px-6 py-3.5">Comprador</th>
              <th class="px-6 py-3.5">Proveedor</th>
              <th class="px-6 py-3.5">Monto</th>
              <th class="px-6 py-3.5">Productos</th>
              <th class="px-6 py-3.5">Fecha</th>
              <th class="px-6 py-3.5">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="ped in pedidos" :key="ped.id" class="hover:bg-slate-50/60 transition-colors">
              <td class="px-6 py-4 font-mono text-xs font-bold text-[#023859]">{{ ped.id }}</td>
              <td class="px-6 py-4 font-bold text-xs text-[#023859]">{{ ped.comprador }}</td>
              <td class="px-6 py-4 text-xs text-slate-600 font-medium">{{ ped.proveedor }}</td>
              <td class="px-6 py-4 font-bold text-xs text-[#023859]">{{ ped.monto }}</td>
              <td class="px-6 py-4 text-xs text-slate-500">{{ ped.items }} unds</td>
              <td class="px-6 py-4 text-xs text-slate-400">{{ ped.fecha }}</td>
              <td class="px-6 py-4">
                <span :class="['inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-bold', ped.badgeStyle]">
                  {{ ped.estado }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const searchQuery = ref("");

const usuarios = ref([
  { id: 1, nombre: "Sofía Martínez", email: "sofia@gmail.com", rol: "Comprador", estado: "activo", fecha: "15/01/2026" },
  { id: 2, nombre: "Carlos López", email: "carlos@empresa.com", rol: "Proveedor", estado: "activo", fecha: "20/02/2026" },
  { id: 3, nombre: "Ana Pérez", email: "ana@correo.com", rol: "Comprador", estado: "activo", fecha: "03/03/2026" },
  { id: 4, nombre: "Jorge Ríos", email: "jorge@nic.com", rol: "Proveedor", estado: "inactivo", fecha: "10/04/2026" },
  { id: 5, nombre: "Marta Gómez", email: "marta@biz.com", rol: "Comprador", estado: "activo", fecha: "25/05/2026" },
  { id: 6, nombre: "Luis Herrera", email: "luis@store.com", rol: "Proveedor", estado: "suspendido", fecha: "12/06/2026" },
  { id: 7, nombre: "Daniela Cruz", email: "dani@hotmail.com", rol: "Comprador", estado: "activo", fecha: "30/07/2026" },
]);

const filtered = () => {
  const q = searchQuery.value.toLowerCase();
  if (!q) return usuarios.value;
  return usuarios.value.filter(
    u => u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.rol.toLowerCase().includes(q)
  );
};

const estadoBadge: Record<string, string> = {
  activo: "bg-teal-50 text-teal-700 border border-teal-200",
  inactivo: "bg-slate-100 text-slate-500 border border-slate-200",
  suspendido: "bg-red-50 text-red-700 border border-red-200",
};

const rolBadge: Record<string, string> = {
  Comprador: "bg-blue-50 text-blue-700",
  Proveedor: "bg-orange-50 text-orange-600",
};
</script>

<template>
  <div class="p-6 md:p-8">
    <div class="mb-6 flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold text-[#062235]">Usuarios</h1>
        <p class="text-sm text-slate-500">Administra los usuarios registrados en la plataforma.</p>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-4 relative max-w-sm">
      <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none"></i>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar usuario..."
        class="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-[#062235] placeholder-slate-400 focus:border-[#1a9b8a] focus:outline-none focus:ring-2 focus:ring-[#1a9b8a]/15"
      />
    </div>

    <!-- Table -->
    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="border-b border-slate-100 bg-slate-50">
            <th class="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">#</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Nombre</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Correo</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Rol</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Estado</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Registro</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Acción</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="usuario in filtered()" :key="usuario.id" class="hover:bg-slate-50 transition-colors">
            <td class="px-6 py-4 text-slate-400 text-xs">{{ usuario.id }}</td>
            <td class="px-6 py-4 font-semibold text-[#062235]">{{ usuario.nombre }}</td>
            <td class="px-6 py-4 text-slate-500">{{ usuario.email }}</td>
            <td class="px-6 py-4">
              <span :class="['inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold', rolBadge[usuario.rol]]">
                {{ usuario.rol }}
              </span>
            </td>
            <td class="px-6 py-4">
              <span :class="['inline-block rounded-full px-3 py-0.5 text-xs font-semibold capitalize', estadoBadge[usuario.estado]]">
                {{ usuario.estado }}
              </span>
            </td>
            <td class="px-6 py-4 text-slate-400">{{ usuario.fecha }}</td>
            <td class="px-6 py-4 flex items-center gap-3">
              <button class="text-xs font-semibold text-[#1a9b8a] hover:underline">Ver</button>
              <button class="text-xs font-semibold text-red-400 hover:underline">Suspender</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const notificaciones = ref([
  {
    id: 1,
    titulo: "Nueva solicitud de recarga #REC-000245",
    mensaje: "María López Vasquez ha registrado un depósito por C$ 2,000.00 en Banco Lafise.",
    tiempo: "Hace 5 minutos",
    leida: false,
    tipo: "recarga",
  },
  {
    id: 2,
    titulo: "Nuevo usuario registrado",
    mensaje: "Se ha registrado el usuario Distribuidora Don Wendy (Proveedor).",
    tiempo: "Hace 1 hora",
    leida: false,
    tipo: "usuario",
  },
  {
    id: 3,
    titulo: "Recarga aprobada #REC-000244",
    mensaje: "La recarga de Juan José Pérez por C$ 1,500.00 fue aprobada con éxito.",
    tiempo: "Hace 3 horas",
    leida: true,
    tipo: "aprobacion",
  },
  {
    id: 4,
    titulo: "Alerta de sistema",
    mensaje: "Resumen diario de operaciones completado sin incidencias.",
    tiempo: "Ayer",
    leida: true,
    tipo: "sistema",
  },
]);

const markAllRead = () => {
  notificaciones.value.forEach((n) => (n.leida = true));
};
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="font-serif text-2xl sm:text-3xl font-bold text-[#023859]">
          Notificaciones del sistema
        </h1>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">
          Historial de alertas y avisos del panel administrativo.
        </p>
      </div>

      <button
        @click="markAllRead"
        class="self-start sm:self-auto flex items-center gap-2 rounded-xl bg-slate-100 border border-slate-200 px-4 py-2 text-xs font-bold text-[#023859] hover:bg-slate-200 transition-colors shrink-0"
      >
        <i class="fa-solid fa-check-double text-[#00a896]"></i>
        <span>Marcar todas como leídas</span>
      </button>
    </div>

    <!-- Notifications List Card -->
    <div class="rounded-2xl border border-slate-100 bg-white shadow-xs overflow-hidden divide-y divide-slate-100">
      <div
        v-for="notif in notificaciones"
        :key="notif.id"
        :class="[
          'p-5 flex items-start gap-4 transition-colors',
          !notif.leida ? 'bg-teal-50/30' : 'hover:bg-slate-50/50'
        ]"
      >
        <div
          :class="[
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base',
            notif.tipo === 'recarga' ? 'bg-orange-50 text-[#f97316]' :
            notif.tipo === 'aprobacion' ? 'bg-teal-50 text-[#00a896]' :
            notif.tipo === 'usuario' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
          ]"
        >
          <i
            :class="[
              notif.tipo === 'recarga' ? 'fa-solid fa-wallet' :
              notif.tipo === 'aprobacion' ? 'fa-solid fa-circle-check' :
              notif.tipo === 'usuario' ? 'fa-solid fa-user-plus' : 'fa-solid fa-bell'
            ]"
          ></i>
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2 mb-1">
            <h4 class="text-xs sm:text-sm font-bold text-[#023859] truncate">
              {{ notif.titulo }}
            </h4>
            <span class="text-[11px] text-slate-400 shrink-0">{{ notif.tiempo }}</span>
          </div>
          <p class="text-xs text-slate-500 leading-relaxed">
            {{ notif.mensaje }}
          </p>
        </div>

        <span
          v-if="!notif.leida"
          class="h-2 w-2 rounded-full bg-[#00a896] shrink-0 mt-2"
          title="No leída"
        ></span>
      </div>
    </div>
  </div>
</template>

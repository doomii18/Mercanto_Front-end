<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useNotificationStore } from '@/stores/notificationStore';
import type { NotificationEvent } from '@/api/services/notifications/types';
import { NewChatMessageEventSchema, QuoteStatusChangedEventSchema } from '@/api/services/notifications/payloads';

const router = useRouter();
const notificationStore = useNotificationStore();

const getNotificationDetails = (event: NotificationEvent) => {
  if (event.type === 'NewChatMessage') {
    const parsed = NewChatMessageEventSchema.safeParse(event);
    if (parsed.success) {
      return {
        icon: 'fa-regular fa-comment-dots',
        color: 'text-teal-600 bg-teal-50',
        title: 'Nuevo mensaje',
        description: parsed.data.content_preview || 'Tienes un nuevo mensaje.',
        route: { name: 'messages' }
      };
    }
  }
  if (event.type === 'QuoteStatusChanged') {
    const parsed = QuoteStatusChangedEventSchema.safeParse(event);
    if (parsed.success) {
      return {
        icon: 'fa-solid fa-box',
        color: 'text-orange-600 bg-orange-50',
        title: 'Pedido actualizado',
        description: `El estado cambió a "${parsed.data.new_status}".`,
        route: { name: 'quote-detail', params: { id: parsed.data.quote_id } }
      };
    }
  }
  return {
    icon: 'fa-solid fa-bell',
    color: 'text-slate-600 bg-slate-50',
    title: 'Notificación',
    description: event.type || 'Nueva actividad en tu cuenta.',
    route: null
  };
};

const goToDetail = (event: NotificationEvent) => {
  const details = getNotificationDetails(event);
  if (details.route) {
    router.push(details.route);
  }
};
</script>

<template>
  <div class="flex flex-col gap-6 w-full max-w-4xl mx-auto">
    <header class="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-[#023859] flex items-center gap-3">
          <i class="fa-solid fa-bell text-[#ff6a00]"></i>
          Notificaciones
        </h1>
        <p class="text-slate-500 text-xs sm:text-sm mt-1">Mantente al día con tus mensajes y cambios en tus pedidos.</p>
      </div>
      <button
        v-if="notificationStore.recentEvents.length > 0"
        type="button"
        class="text-xs sm:text-sm text-slate-500 hover:text-red-500 flex items-center gap-2 transition-colors"
        @click="notificationStore.clearEvents()"
      >
        <i class="fa-regular fa-trash-can"></i> Limpiar
      </button>
    </header>

    <div v-if="notificationStore.recentEvents.length === 0" class="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-xs">
      <div class="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-2xl mb-4">
        <i class="fa-regular fa-bell-slash"></i>
      </div>
      <h3 class="text-lg font-bold text-[#023859] mb-1">No hay notificaciones</h3>
      <p class="text-slate-500 text-sm">Cuando recibas mensajes o actualizaciones, aparecerán aquí.</p>
    </div>

    <div v-else class="flex flex-col gap-3">
      <div
        v-for="event in notificationStore.recentEvents"
        :key="event.notification_id"
        class="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group shadow-xs"
        @click="goToDetail(event)"
      >
        <div
          class="w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0"
          :class="getNotificationDetails(event).color"
        >
          <i :class="getNotificationDetails(event).icon"></i>
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="font-bold text-[#023859] text-sm mb-0.5">{{ getNotificationDetails(event).title }}</h4>
          <p class="text-slate-500 text-xs truncate">{{ getNotificationDetails(event).description }}</p>
        </div>
        <div class="text-slate-400 text-xs shrink-0 group-hover:text-[#ff6a00] transition-colors">
          <i class="fa-solid fa-chevron-right"></i>
        </div>
      </div>
    </div>
  </div>
</template>

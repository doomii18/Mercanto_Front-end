<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationStore } from '@/stores/notificationStore';
import type { NotificationEvent } from '@/api/services/notifications/types';
import { NewChatMessageEventSchema, QuoteStatusChangedEventSchema } from '@/api/services/notifications/payloads';

const router = useRouter();
const notificationStore = useNotificationStore();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const unreadCount = computed(() => notificationStore.recentEvents.length);
const recentNotifications = computed(() => notificationStore.recentEvents.slice(0, 5));

const getPreview = (event: NotificationEvent) => {
  if (event.type === 'NewChatMessage') {
    const parsed = NewChatMessageEventSchema.safeParse(event);
    return parsed.success ? parsed.data.content_preview : 'Nuevo mensaje';
  }
  if (event.type === 'QuoteStatusChanged') {
    const parsed = QuoteStatusChangedEventSchema.safeParse(event);
    return parsed.success ? `Estado: ${parsed.data.new_status}` : 'Pedido actualizado';
  }
  return 'Nueva notificación';
};

const getIcon = (event: NotificationEvent) => {
  if (event.type === 'NewChatMessage') return 'fa-regular fa-comment-dots text-teal-600';
  if (event.type === 'QuoteStatusChanged') return 'fa-solid fa-box text-orange-600';
  return 'fa-solid fa-bell text-slate-600';
};

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const goToPanel = () => {
  isOpen.value = false;
  router.push({ name: 'notifications' });
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => document.addEventListener('click', handleClickOutside));
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside));
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <button
      type="button"
      class="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-[#fde8e4] hover:text-[#ff6a00] transition-colors"
      @click.stop="toggleDropdown"
      aria-label="Ver notificaciones"
    >
      <i class="fa-regular fa-bell text-lg"></i>
      <span
        v-if="unreadCount > 0"
        class="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#ff6a00] text-[10px] font-bold text-white"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <transition name="dropdown-fade">
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden"
      >
        <div class="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-bold text-[#023859] text-sm">Notificaciones</h3>
          <span v-if="unreadCount > 0" class="text-xs text-[#ff6a00] font-semibold">{{ unreadCount }} nuevas</span>
        </div>

        <div class="max-h-80 overflow-y-auto">
          <div v-if="recentNotifications.length === 0" class="p-6 text-center text-slate-400 text-sm">
            No hay notificaciones recientes.
          </div>
          <div
            v-for="event in recentNotifications"
            :key="event.notification_id"
            class="p-3 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
            @click="goToPanel"
          >
            <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <i :class="getIcon(event)"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-slate-800 font-medium line-clamp-2">{{ getPreview(event) }}</p>
              <span class="text-[10px] text-slate-400 mt-0.5 block">{{ event.type }}</span>
            </div>
          </div>
        </div>

        <div class="p-3 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            class="w-full text-center text-xs font-bold text-[#ff6a00] hover:underline py-1"
            @click="goToPanel"
          >
            Ver todas las notificaciones
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>

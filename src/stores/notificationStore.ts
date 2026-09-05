import { defineStore } from 'pinia';
import { ref } from 'vue';
import { notificationsApi } from '@/api';
import type { NotificationEvent, NotificationCallback } from '@/api/services/notifications/types';
import { useAuthStore } from '@/modules/auth';
import { useToastStore } from './toastStore';
import { NewChatMessageEventSchema, QuoteStatusChangedEventSchema } from '@/api/services/notifications/payloads';

export const useNotificationStore = defineStore('notification', () => {
  // Connection State
  const isConnected = ref(false);
  const isConnecting = ref(false);
  const connectionError = ref<Error | null>(null);
  const recentEvents = ref<NotificationEvent[]>([]);
  const MAX_EVENTS = 50;

  let globalUnsub: (() => void) | null = null;

  async function connect() {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) return;
    if (isConnected.value || isConnecting.value) return;

    isConnecting.value = true;
    connectionError.value = null;

    try {
      await notificationsApi.connect();
      isConnected.value = true;

      if (!globalUnsub) {
        globalUnsub = notificationsApi.subscribeAll((ev) => {
          const currentUserId = authStore.account?.id;


          if (ev.type === 'NewChatMessage') {
            const parsed = NewChatMessageEventSchema.safeParse(ev);
            // If the message was sent by the currently logged-in user, skip it
            if (parsed.success && parsed.data.sender_id === currentUserId) {
              return;
            }
          }


          recentEvents.value.unshift(ev);
          if (recentEvents.value.length > MAX_EVENTS) {
            recentEvents.value.pop();
          }


          const toastStore = useToastStore();
          let title = 'Nueva notificación';
          let message = 'Tienes una nueva actividad en tu cuenta.';
          let icon = 'fa-solid fa-bell';
          let variant: 'success' | 'info' | 'warning' | 'error' = 'info';

          if (ev.type === 'NewChatMessage') {
            const parsed = NewChatMessageEventSchema.safeParse(ev);
            if (parsed.success) {
              title = 'Nuevo mensaje';
              message = parsed.data.content_preview || 'Has recibido un nuevo mensaje.';
              icon = 'fa-regular fa-comment-dots';
            }
          } else if (ev.type === 'QuoteStatusChanged') {
            const parsed = QuoteStatusChangedEventSchema.safeParse(ev);
            if (parsed.success) {
              title = 'Pedido actualizado';
              message = `El estado del pedido cambió a "${parsed.data.new_status}".`;
              icon = 'fa-solid fa-box';
              variant = 'success';
            }
          }

          toastStore.addToast({
            title,
            message,
            icon,
            variant,
            duration: 5000,
          });
        });
      }
    } catch (err: any) {
      connectionError.value = err instanceof Error ? err : new Error(String(err));
      console.error("Notification connection failed", err);
    } finally {
      isConnecting.value = false;
    }
  }

  function disconnect() {
    notificationsApi.disconnect();
    isConnected.value = false;
    if (globalUnsub) {
      globalUnsub();
      globalUnsub = null;
    }
    recentEvents.value = [];
  }

  function clearEvents() {
    recentEvents.value = [];
  }


  function subscribe(eventType: string, callback: NotificationCallback): () => void {
    return notificationsApi.subscribe(eventType, callback);
  }

  function subscribeAll(callback: NotificationCallback): () => void {
    return notificationsApi.subscribeAll(callback);
  }

  return {
    isConnected,
    isConnecting,
    connectionError,
    recentEvents,
    connect,
    disconnect,
    clearEvents,
    subscribe,
    subscribeAll,
  };
});

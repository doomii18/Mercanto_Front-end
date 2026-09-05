import { defineStore } from 'pinia';
import { ref } from 'vue';
import { notificationsApi } from '@/api';
import type { NotificationEvent, NotificationCallback } from '@/api/services/notifications/types';
import { useAuthStore } from '@/modules/auth';

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
          recentEvents.value.unshift(ev);
          if (recentEvents.value.length > MAX_EVENTS) {
            recentEvents.value.pop();
          }
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

  // Expose underlying subscribe methods for components needing specific event routing
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

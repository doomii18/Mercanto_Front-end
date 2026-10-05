import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/ui";
import { notificationBus } from "@/events/notificationEvents";
import {
  useNotificationsApi,
  useNotificationEventSource,
} from "@/api/modules/messaging/notifications/useNotificationsApi";
import { NotificationEventSchema } from "@/api/modules/messaging/notifications/responses";
import type { NotificationEvent } from "@/api";

export const useNotificationStore = defineStore("notification", () => {
  const notificationsApi = useNotificationsApi();
  const { status, latestEvent, connect: streamConnect, disconnect: streamDisconnect } =
    useNotificationEventSource();

  const unreadCount = ref<number>(0);
  const recentEvents = ref<NotificationEvent[]>([]);
  const isInitialized = ref<boolean>(false);

  function dispatchToast(event: NotificationEvent) {
    const authStore = useAuthStore();
    const currentUserId = authStore.account?.id;
    const toastStore = useToastStore();

    if (event.type === "NewChatMessage") {
      if (event.sender_id === currentUserId) return;
      toastStore.addToast({
        title: "Nuevo mensaje",
        message: event.content_preview || "Has recibido un nuevo mensaje.",
        icon: "fa-regular fa-comment-dots",
        variant: "info",
        duration: 5000,
      });
    } else if (event.type === "QuoteStatusChanged") {
      toastStore.addToast({
        title: "Pedido actualizado",
        message: `El estado del pedido cambió a "${event.new_status}".`,
        icon: "fa-solid fa-box",
        variant: "success",
        duration: 6000,
      });
    } else if (event.type === "QuoteRequestReceived") {
      toastStore.addToast({
        title: "Nueva cotización",
        message: `Has recibido una solicitud con ${event.item_count} producto(s).`,
        icon: "fa-solid fa-file-invoice-dollar",
        variant: "info",
        duration: 6000,
      });
    } else if (event.type === "ProductOutOfStock") {
      toastStore.addToast({
        title: "Inventario agotado",
        message: `El producto "${event.product_title}" se ha quedado sin stock.`,
        icon: "fa-solid fa-triangle-exclamation",
        variant: "warning",
        duration: 7000,
      });
    } else if (event.type === "WalletDepositStatusChanged") {
      const isApproved = event.new_status === "approved";
      toastStore.addToast({
        title: isApproved ? "Recarga aprobada" : "Recarga rechazada",
        message: isApproved
          ? `Tu recarga de C$ ${event.amount} ha sido aprobada y acreditada a tu billetera.`
          : `Tu solicitud de recarga de C$ ${event.amount} fue rechazada.${event.reason ? ` Motivo: ${event.reason}` : ""}`,
        icon: isApproved ? "fa-solid fa-wallet" : "fa-solid fa-circle-xmark",
        variant: isApproved ? "success" : "error",
        duration: 7000,
      });
    } else if (event.type === "WalletWithdrawalStatusChanged") {
      const isCompleted = event.new_status === "completed";
      toastStore.addToast({
        title: isCompleted ? "Retiro completado" : "Retiro rechazado",
        message: isCompleted
          ? `Tu retiro de C$ ${event.amount} ha sido transferido exitosamente.`
          : `Tu retiro de C$ ${event.amount} fue rechazado y reembolsado a tu saldo.${event.reason ? ` Motivo: ${event.reason}` : ""}`,
        icon: isCompleted ? "fa-solid fa-money-bill-transfer" : "fa-solid fa-circle-xmark",
        variant: isCompleted ? "success" : "error",
        duration: 7000,
      });
    }
  }

  // React to incoming validated events from the SSE stream
  watch(latestEvent, (event) => {
    if (!event) return;

    const authStore = useAuthStore();
    const currentUserId = authStore.account?.id;
    if (event.type === "NewChatMessage" && event.sender_id === currentUserId) {
      return;
    }

    const isDuplicate = recentEvents.value.some(
      (e) => e.notification_id === event.notification_id
    );

    if (!isDuplicate) {
      recentEvents.value.unshift(event);
      if (recentEvents.value.length > 50) {
        recentEvents.value.pop();
      }
      unreadCount.value++;
    }

    notificationBus.emit(event);
    dispatchToast(event);
  });

  async function fetchUnreadCount(): Promise<number> {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) {
      unreadCount.value = 0;
      return 0;
    }

    try {
      const response = await notificationsApi.getUnreadCount();
      unreadCount.value = response.count;
      return response.count;
    } catch (err: unknown) {
      console.warn("[NotificationStore] Failed to fetch unread count:", err);
      return unreadCount.value;
    }
  }

  async function fetchRecentNotifications(limit = 5): Promise<void> {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) return;

    try {
      const response = await notificationsApi.getNotificationHistory({
        limit,
        offset: 0,
      });
      const parsedEvents: NotificationEvent[] = [];
      for (const item of response.data) {
        const candidate = {
          ...item.payload,
          notification_id: item.id,
        };
        const parsed = NotificationEventSchema.safeParse(candidate);
        if (parsed.success) {
          parsedEvents.push(parsed.data);
        }
      }
      recentEvents.value = parsedEvents;
    } catch (err: unknown) {
      console.warn("[NotificationStore] Failed to fetch recent notifications:", err);
    }
  }

  function decrementUnreadCount(amount = 1): void {
    unreadCount.value = Math.max(0, unreadCount.value - amount);
  }

  function setUnreadCount(count: number): void {
    unreadCount.value = Math.max(0, count);
  }

  async function connect(): Promise<void> {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) return;

    await Promise.allSettled([
      streamConnect(),
      fetchUnreadCount(),
      fetchRecentNotifications(5),
    ]);
    isInitialized.value = true;
  }

  function disconnect(): void {
    streamDisconnect();
    recentEvents.value = [];
    unreadCount.value = 0;
    isInitialized.value = false;
  }

  function on(callback: (event: NotificationEvent) => void) {
    return notificationBus.on(callback);
  }

  function onType<T extends NotificationEvent["type"]>(
    type: T,
    callback: (event: Extract<NotificationEvent, { type: T }>) => void,
  ) {
    return notificationBus.on((event) => {
      if (event.type === type) {
        callback(event as Extract<NotificationEvent, { type: T }>);
      }
    });
  }

  return {
    status,
    unreadCount,
    recentEvents,
    isInitialized,
    fetchUnreadCount,
    fetchRecentNotifications,
    decrementUnreadCount,
    setUnreadCount,
    connect,
    disconnect,
    on,
    onType,
  };
});

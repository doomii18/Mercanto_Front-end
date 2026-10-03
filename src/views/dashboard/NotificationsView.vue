<script setup lang="ts">
import { ref, computed, onMounted, onScopeDispose } from "vue";
import { useRoute, useRouter, type RouteLocationRaw } from "vue-router";
import { useNotificationStore } from "@/stores/notifications";
import { useNotificationsApi } from "@/api/modules/messaging/notifications/useNotificationsApi";
import type { NotificationEvent } from "@/api";
import { useToastStore } from "@/stores/ui";

interface DisplayNotification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  category: "all" | "message" | "order" | "stock" | "system";
  icon: string;
  iconBg: string;
  iconColor: string;
  route?: RouteLocationRaw | null;
  rawPayload?: Record<string, unknown>;
}

const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();
const notificationsApi = useNotificationsApi();
const toastStore = useToastStore();

// Context detection: Admin vs Regular Dashboard
const isAdminContext = computed(() => route.path.startsWith("/admin"));

// State
const notifications = ref<DisplayNotification[]>([]);
const isLoading = ref(false);
const isMarkingRead = ref(false);

// Filter Tabs
type FilterTab = "all" | "unread" | "message" | "order" | "system";
const activeFilter = ref<FilterTab>("all");

function formatQuoteStatus(status: string): string {
  const map: Record<string, string> = {
    draft: "Borrador",
    requested: "Solicitado",
    quoted: "Cotizado",
    accepted: "Aceptado",
    rejected: "Rechazado",
    expired: "Expirado",
    cancelled: "Cancelado",
  };
  return map[status.toLowerCase()] ?? status;
}

function parsePayloadToDisplay(
  id: string,
  payload: Record<string, unknown>,
  isRead: boolean,
  createdAt: Date
): DisplayNotification {
  const type = String(payload.type ?? "");

  if (type === "NewChatMessage") {
    const preview = typeof payload.content_preview === "string" ? payload.content_preview : "Has recibido un nuevo mensaje.";
    return {
      id,
      title: "Nuevo mensaje de chat",
      message: preview,
      timestamp: createdAt,
      isRead,
      category: "message",
      icon: "fa-regular fa-comment-dots",
      iconBg: "bg-teal-50",
      iconColor: "text-[#00a896]",
      route: { name: "messages" },
      rawPayload: payload,
    };
  }

  if (type === "QuoteStatusChanged") {
    const newStatus = typeof payload.new_status === "string" ? payload.new_status : "actualizado";
    const quoteId = typeof payload.quote_id === "string" ? payload.quote_id : "";
    return {
      id,
      title: "Estado de pedido actualizado",
      message: `El pedido cambió a estado "${formatQuoteStatus(newStatus)}".`,
      timestamp: createdAt,
      isRead,
      category: "order",
      icon: "fa-solid fa-box",
      iconBg: "bg-orange-50",
      iconColor: "text-[#f97316]",
      route: isAdminContext.value
        ? { name: "admin-orders" }
        : quoteId
        ? { name: "quote-detail", params: { id: quoteId } }
        : { name: "orders" },
      rawPayload: payload,
    };
  }

  if (type === "QuoteRequestReceived") {
    const count = typeof payload.item_count === "number" ? payload.item_count : 1;
    return {
      id,
      title: "Nueva solicitud de cotización",
      message: `Has recibido una solicitud con ${count} producto(s).`,
      timestamp: createdAt,
      isRead,
      category: "order",
      icon: "fa-solid fa-file-invoice-dollar",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      route: isAdminContext.value ? { name: "admin-orders" } : { name: "orders" },
      rawPayload: payload,
    };
  }

  if (type === "ProductOutOfStock") {
    const title = typeof payload.product_title === "string" ? payload.product_title : "Un producto";
    return {
      id,
      title: "Alerta de inventario agotado",
      message: `El producto "${title}" se ha quedado sin existencias disponibles.`,
      timestamp: createdAt,
      isRead,
      category: "stock",
      icon: "fa-solid fa-triangle-exclamation",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      route: isAdminContext.value ? { name: "admin-home" } : { name: "provider-products" },
      rawPayload: payload,
    };
  }

  // Fallback for system or custom alerts
  const title = typeof payload.title === "string" ? payload.title : "Notificación de actividad";
  const message = typeof payload.message === "string" ? payload.message : "Nueva actividad registrada en tu cuenta.";
  return {
    id,
    title,
    message,
    timestamp: createdAt,
    isRead,
    category: "system",
    icon: "fa-solid fa-bell",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    route: null,
    rawPayload: payload,
  };
}

// Fetch persisted notification history from the backend API
async function fetchNotificationHistory(): Promise<void> {
  isLoading.value = true;
  try {
    const response = await notificationsApi.getNotificationHistory({ limit: 50, offset: 0 });
    const fetchedItems = response.data.map((item) => {
      const createdAt = new Date(item.created_at);
      return parsePayloadToDisplay(item.id, item.payload, item.is_read, createdAt);
    });

    // Merge with any real-time events that arrived before history completed
    const existingIds = new Set(fetchedItems.map((n) => n.id));
    const liveRecent = notifications.value.filter((n) => !existingIds.has(n.id));

    notifications.value = [...liveRecent, ...fetchedItems];
  } catch (err: unknown) {
    console.warn("Could not load notification history from API:", err);
  } finally {
    isLoading.value = false;
  }
}

// Subscribe to real-time events
const unsubscribe = notificationStore.on((event: NotificationEvent) => {
  // Prevent duplicate insertion
  if (notifications.value.some((n) => n.id === event.notification_id)) {
    return;
  }

  const liveNotif = parsePayloadToDisplay(
    event.notification_id,
    event as unknown as Record<string, unknown>,
    false,
    new Date()
  );
  notifications.value.unshift(liveNotif);
});

onScopeDispose(() => {
  unsubscribe();
});

onMounted(() => {
  fetchNotificationHistory();
});

// Filtered notifications
const filteredNotifications = computed(() => {
  return notifications.value.filter((n) => {
    if (activeFilter.value === "unread") return !n.isRead;
    if (activeFilter.value === "message") return n.category === "message";
    if (activeFilter.value === "order") return n.category === "order";
    if (activeFilter.value === "system") return n.category === "system" || n.category === "stock";
    return true;
  });
});

const unreadCount = computed(() => {
  return notifications.value.filter((n) => !n.isRead).length;
});

// Mark all as read / seen (does NOT delete)
async function markAllAsRead(): Promise<void> {
  const unreadItems = notifications.value.filter((n) => !n.isRead);
  if (unreadItems.length === 0) return;

  const ids = unreadItems.map((n) => n.id);
  // Optimistically mark as seen in local state
  unreadItems.forEach((n) => {
    n.isRead = true;
  });

  isMarkingRead.value = true;
  try {
    await notificationsApi.markNotificationsRead({ ids });
    toastStore.addToast({
      title: "Notificaciones actualizadas",
      message: "Todas las notificaciones han sido marcadas como leídas.",
      variant: "success",
    });
  } catch (err: unknown) {
    console.error("Failed to mark notifications as read on server:", err);
  } finally {
    isMarkingRead.value = false;
  }
}

// Click single notification -> mark as read & navigate
async function handleNotificationClick(notif: DisplayNotification): Promise<void> {
  if (!notif.isRead) {
    notif.isRead = true;
    try {
      await notificationsApi.markNotificationsRead({ ids: [notif.id] });
    } catch (err: unknown) {
      console.warn("Could not mark notification as read on server:", err);
    }
  }

  if (notif.route) {
    router.push(notif.route);
  }
}

// Relative time formatting
function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 45) return "Hace un momento";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHours === 1) return "Hace 1 hora";
  if (diffHours < 24) return `Hace ${diffHours} horas`;
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;

  return date.toLocaleDateString("es-NI", {
    day: "2-digit",
    month: "short",
  });
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 w-full">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="font-serif text-2xl sm:text-3xl font-bold text-[#023859] flex items-center gap-3">
          <i class="fa-solid fa-bell text-[#00a896]"></i>
          <span>{{ isAdminContext ? "Notificaciones del sistema" : "Notificaciones" }}</span>
        </h1>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">
          {{
            isAdminContext
              ? "Historial completo de alertas, mensajes y avisos del panel administrativo."
              : "Historial completo de mensajes, pedidos y avisos de tu cuenta."
          }}
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2 self-start sm:self-auto shrink-0">
        <button
          type="button"
          @click="fetchNotificationHistory"
          :disabled="isLoading"
          class="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          title="Actualizar historial"
        >
          <i :class="['fa-solid fa-arrows-rotate', isLoading ? 'animate-spin text-[#00a896]' : 'text-slate-400']"></i>
          <span class="hidden sm:inline">Actualizar</span>
        </button>

        <button
          type="button"
          @click="markAllAsRead"
          :disabled="unreadCount === 0 || isMarkingRead"
          class="flex items-center gap-2 rounded-xl bg-slate-100 border border-slate-200 px-3.5 py-2 text-xs font-bold text-[#023859] hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Marcar todas las notificaciones como vistas"
        >
          <i :class="[isMarkingRead ? 'fa-solid fa-spinner animate-spin' : 'fa-solid fa-check-double text-[#00a896]']"></i>
          <span>Marcar todas como leídas</span>
        </button>
      </div>
    </div>

    <!-- Filter Pills / Tabs -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
      <button
        type="button"
        @click="activeFilter = 'all'"
        :class="[
          'rounded-xl px-3.5 py-2 font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5',
          activeFilter === 'all'
            ? 'bg-[#023859] text-white shadow-xs'
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
        ]"
      >
        <span>Todas</span>
        <span
          :class="[
            'rounded-full px-1.5 py-0.2 text-[10px]',
            activeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          ]"
        >
          {{ notifications.length }}
        </span>
      </button>

      <button
        type="button"
        @click="activeFilter = 'unread'"
        :class="[
          'rounded-xl px-3.5 py-2 font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5',
          activeFilter === 'unread'
            ? 'bg-[#00a896] text-white shadow-xs'
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
        ]"
      >
        <span>No leídas</span>
        <span
          v-if="unreadCount > 0"
          :class="[
            'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
            activeFilter === 'unread' ? 'bg-white/20 text-white' : 'bg-[#00a896]/15 text-[#00a896]'
          ]"
        >
          {{ unreadCount }}
        </span>
      </button>

      <button
        type="button"
        @click="activeFilter = 'message'"
        :class="[
          'rounded-xl px-3.5 py-2 font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5',
          activeFilter === 'message'
            ? 'bg-[#023859] text-white shadow-xs'
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
        ]"
      >
        <i class="fa-regular fa-comment-dots text-xs"></i>
        <span>Mensajes</span>
      </button>

      <button
        type="button"
        @click="activeFilter = 'order'"
        :class="[
          'rounded-xl px-3.5 py-2 font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5',
          activeFilter === 'order'
            ? 'bg-[#023859] text-white shadow-xs'
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
        ]"
      >
        <i class="fa-solid fa-box text-xs"></i>
        <span>Pedidos</span>
      </button>

      <button
        type="button"
        @click="activeFilter = 'system'"
        :class="[
          'rounded-xl px-3.5 py-2 font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5',
          activeFilter === 'system'
            ? 'bg-[#023859] text-white shadow-xs'
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
        ]"
      >
        <i class="fa-solid fa-shield-halved text-xs"></i>
        <span>Sistema</span>
      </button>
    </div>

    <!-- Loading Skeleton Rows -->
    <div
      v-if="isLoading && notifications.length === 0"
      class="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden divide-y divide-slate-100"
    >
      <div v-for="i in 4" :key="i" class="p-5 flex items-start gap-4 animate-pulse">
        <div class="h-10 w-10 rounded-xl bg-slate-200 shrink-0"></div>
        <div class="flex-1 space-y-2">
          <div class="flex items-center justify-between">
            <div class="h-4 w-40 rounded-sm bg-slate-200"></div>
            <div class="h-3 w-16 rounded-sm bg-slate-100"></div>
          </div>
          <div class="h-3 w-3/4 rounded-sm bg-slate-100"></div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredNotifications.length === 0"
      class="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-xs"
    >
      <div class="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-2xl mb-4">
        <i class="fa-regular fa-bell-slash"></i>
      </div>
      <h3 class="text-lg font-bold text-[#023859] mb-1">No hay notificaciones</h3>
      <p class="text-slate-400 text-xs sm:text-sm text-center max-w-sm">
        {{
          activeFilter === "unread"
            ? "No tienes notificaciones pendientes de leer."
            : "El historial de notificaciones aparecerá aquí conforme se generen eventos en la plataforma."
        }}
      </p>
    </div>

    <!-- Notifications History List Card -->
    <div
      v-else
      class="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden divide-y divide-slate-100"
    >
      <div
        v-for="notif in filteredNotifications"
        :key="notif.id"
        @click="handleNotificationClick(notif)"
        :class="[
          'p-4 sm:p-5 flex items-start gap-4 transition-all cursor-pointer group',
          !notif.isRead ? 'bg-teal-50/25 hover:bg-teal-50/45' : 'hover:bg-slate-50/70'
        ]"
      >
        <!-- Category Icon Badge -->
        <div
          :class="[
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base transition-transform group-hover:scale-105',
            notif.iconBg,
            notif.iconColor
          ]"
        >
          <i :class="notif.icon"></i>
        </div>

        <!-- Middle Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2 mb-1">
            <h4
              :class="[
                'text-xs sm:text-sm truncate font-semibold',
                !notif.isRead ? 'text-[#023859] font-bold' : 'text-slate-700'
              ]"
            >
              {{ notif.title }}
            </h4>
            <span class="text-[11px] text-slate-400 shrink-0 whitespace-nowrap">
              {{ formatRelativeTime(notif.timestamp) }}
            </span>
          </div>

          <p class="text-xs text-slate-500 leading-relaxed line-clamp-2">
            {{ notif.message }}
          </p>
        </div>

        <!-- Unread Indicator & Chevron -->
        <div class="flex items-center gap-2 shrink-0 mt-2">
          <span
            v-if="!notif.isRead"
            class="h-2 w-2 rounded-full bg-[#00a896] shrink-0"
            title="No vista"
          ></span>
          <i
            class="fa-solid fa-chevron-right text-xs text-slate-300 group-hover:text-[#00a896] group-hover:translate-x-0.5 transition-all"
          ></i>
        </div>
      </div>
    </div>
  </div>
</template>

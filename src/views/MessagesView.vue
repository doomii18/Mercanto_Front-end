<script setup lang="ts">
import { ref, computed, onMounted, onScopeDispose, nextTick } from "vue";
import { useChatApi } from "@/composables/api/useChatApi";
import { useQuoteApi } from "@/composables/api/useQuoteApi";
import { useUserContextStore } from "../stores/userContextStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useAuthStore } from "@/stores/authStore";
import { formatUuidv7ToLocalTime } from "../utils/formatters";
import type { ChatThreadResponse, ChatMessageResponse } from "../api/services/chat/types";
import ProfileAvatar from "../components/profile/ProfileAvatar.vue";
import ProviderLogo from "../components/organization/ProviderLogo.vue";
import { useUserProfileApi } from "@/composables/api/useUserProfileApi";
import { useOrganizationApi } from "@/composables/api/useOrganizationApi";

import mercantoLogo from "../assets/1.1 Imagotipo variacion.png";
import echLogo from "../assets/ech-logo.png";
import dicegsaLogo from "../assets/dicegsa-logo.png";

const authStore = useAuthStore();
const contextStore = useUserContextStore();
const notificationStore = useNotificationStore();
const userProfileApi = useUserProfileApi();
const organizationApi = useOrganizationApi();
const chatApi = useChatApi();
const quoteApi = useQuoteApi();

const threads = ref<ChatThreadResponse[]>([]);
const activeThreadId = ref<string | null>(null);
const currentMessages = ref<ChatMessageResponse[]>([]);

interface ThreadPreview {
  preview: string;
  time: string;
  hasUnread: boolean;
  name: string;
  avatarBlobId: string | null;
  imgSrc?: string;
  quoteGroupId: string;
}

const threadPreviews = ref<Record<string, ThreadPreview>>({});
const searchQuery = ref("");
const activeTab = ref<"todos" | "no-leidos">("todos");
const newMessage = ref("");
const isLoadingThreads = ref(true);
const isLoadingMessages = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);

const isProvider = computed(() => contextStore.isProvider);
const orgId = computed(() => contextStore.activeOrganizationId);

function isOnline(seedStr: string | null | undefined): boolean {
  if (!seedStr) return false;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 10 < 3;
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

const activeThread = computed(() => {
  return threads.value.find((t) => t.id === activeThreadId.value) ?? null;
});

const filteredThreads = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return threads.value.filter((t) => {
    const meta = threadPreviews.value[t.id];
    const matchesSearch =
      t.id.toLowerCase().includes(query) ||
      t.quote_group_id.toLowerCase().includes(query) ||
      (meta?.name && meta.name.toLowerCase().includes(query));
    const matchesTab =
      activeTab.value === "todos" ||
      (activeTab.value === "no-leidos" && meta?.hasUnread);
    return matchesSearch && matchesTab;
  });
});

async function selectThread(threadId: string) {
  if (activeThreadId.value === threadId) return;
  activeThreadId.value = threadId;
  isLoadingMessages.value = true;
  currentMessages.value = [];

  try {
    const res = await chatApi.getThreadMessages(threadId, { limit: 50, offset: 0 });
    currentMessages.value = res.data.reverse();

    if (threadPreviews.value[threadId]) {
      threadPreviews.value[threadId].hasUnread = false;
      const lastMsg = currentMessages.value[currentMessages.value.length - 1];
      if (lastMsg) {
        threadPreviews.value[threadId].time = formatUuidv7ToLocalTime(lastMsg.id);
      }
    }

    const unreadIds = currentMessages.value
      .filter((m) => !m.is_read && m.sender_id !== authStore.account?.id)
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      chatApi.markMessagesAsRead({ message_ids: unreadIds }).catch(console.error);
    }

    scrollToBottom();
  } catch (err) {
    console.error("Failed to load thread messages:", err);
  } finally {
    isLoadingMessages.value = false;
  }
}

async function sendMessage() {
  const text = newMessage.value.trim();
  if (!text || !activeThreadId.value) return;

  const targetThreadId = activeThreadId.value;
  newMessage.value = "";

  try {
    const sentMsg = await chatApi.publishChatMessage(targetThreadId, { content: text });

    if (!currentMessages.value.some((m) => m.id === sentMsg.id)) {
      currentMessages.value.push(sentMsg);
    }

    if (threadPreviews.value[targetThreadId]) {
      threadPreviews.value[targetThreadId].preview = text;
      threadPreviews.value[targetThreadId].time = formatUuidv7ToLocalTime(sentMsg.id);
      threadPreviews.value[targetThreadId].hasUnread = false;
    }

    scrollToBottom();
  } catch (err) {
    console.error("Failed to send chat message:", err);
  }
}

const resolveThreadMetadata = async (threadsList: ChatThreadResponse[]) => {
  if (threadsList.length === 0) return;

  const quotePromises = threadsList.map((t) => {
    if (isProvider.value && orgId.value) {
      return quoteApi
        .getProviderQuotes(orgId.value, { quote_group_id: t.quote_group_id, limit: 1 })
        .catch(() => null);
    } else {
      return quoteApi
        .getMyQuotes({ quote_group_id: t.quote_group_id, limit: 1 })
        .catch(() => null);
    }
  });

  const quoteResults = await Promise.all(quotePromises);

  const otherPartyIds = new Set<string>();
  const threadQuoteMap = new Map<string, { buyerId: string; providerId: string }>();

  quoteResults.forEach((res, idx) => {
    if (res && res.data.length > 0) {
      const q = res.data[0].quote;
      threadQuoteMap.set(threadsList[idx].id, {
        buyerId: q.buyer_id,
        providerId: q.provider_id,
      });
      const otherId = isProvider.value ? q.buyer_id : q.provider_id;
      if (otherId) otherPartyIds.add(otherId);
    }
  });

  const profilePromises = Array.from(otherPartyIds).map((id) => {
    if (isProvider.value) {
      return userProfileApi
        .getUserProfile(id)
        .then((p) => ({ id, type: "buyer", data: p }))
        .catch(() => null);
    } else {
      return organizationApi
        .getPublicProvider(id)
        .then((p) => ({ id, type: "provider", data: p }))
        .catch(() => null);
    }
  });

  const profileResults = await Promise.all(profilePromises);
  const profileMap = new Map<string, { type: string; data: any }>();
  profileResults.forEach((res) => {
    if (res) profileMap.set(res.id, res);
  });

  threadsList.forEach((t) => {
    const ids = threadQuoteMap.get(t.id);
    const otherId = isProvider.value ? ids?.buyerId : ids?.providerId;
    const profile = otherId ? profileMap.get(otherId) : null;

    let name = "Usuario";
    let avatarBlobId: string | null = null;

    if (profile) {
      if (profile.type === "buyer") {
        name = `${profile.data.first_name} ${profile.data.last_name}`.trim() || "Comprador";
        avatarBlobId = profile.data.avatar_blob_id ?? null;
      } else {
        name = profile.data.company_name || "Proveedor";
        avatarBlobId = profile.data.logo_blob_id ?? null;
      }
    }

    threadPreviews.value[t.id] = {
      preview: threadPreviews.value[t.id]?.preview || `Pedido: ${t.quote_group_id.substring(0, 8)}...`,
      time: formatUuidv7ToLocalTime(t.updated_at),
      hasUnread: threadPreviews.value[t.id]?.hasUnread || false,
      name,
      avatarBlobId,
      quoteGroupId: t.quote_group_id,
    };
  });
};

// 1. Setup Typed Event Listener with Automatic Scope Cleanup
const unsubscribeChat = notificationStore.onType("NewChatMessage", (event) => {
  const existing = threadPreviews.value[event.thread_id];
  threadPreviews.value[event.thread_id] = {
    preview: event.content_preview,
    time: formatUuidv7ToLocalTime(event.message_id),
    hasUnread: activeThreadId.value !== event.thread_id,
    name: existing?.name || "Nuevo Mensaje",
    avatarBlobId: existing?.avatarBlobId || null,
    quoteGroupId: existing?.quoteGroupId || "",
  };

  if (activeThreadId.value === event.thread_id) {
    if (!currentMessages.value.some((m) => m.id === event.message_id)) {
      currentMessages.value.push({
        id: event.message_id,
        thread_id: event.thread_id,
        sender_id: event.sender_id,
        content: event.content_preview,
        is_read: true,
      });
      scrollToBottom();
    }
    chatApi.markMessagesAsRead({ message_ids: [event.message_id] }).catch(console.error);
  }
});

onScopeDispose(() => {
  unsubscribeChat();
});

// 2. Lifecycle Initialization
onMounted(async () => {
  try {
    await authStore.initialize();
    if (!contextStore.isInitialized) {
      await contextStore.initialize();
    }

    const res = await chatApi.getUserChatThreads({ limit: 50, offset: 0 });
    
    // Inject Mock Threads for Demo UI
    const mockThreads: ChatThreadResponse[] = [
      {
        id: "sys-approved",
        quote_group_id: "SYS-001",
        updated_at: new Date().toISOString(),
        is_archived: false,
      },
      {
        id: "sys-rejected",
        quote_group_id: "SYS-002",
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        is_archived: false,
      },
      {
        id: "mock-echamorro",
        quote_group_id: "ORD-ECH",
        updated_at: new Date(Date.now() - 7200000).toISOString(),
        is_archived: false,
      },
      {
        id: "mock-dicegsa",
        quote_group_id: "ORD-DIC",
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        is_archived: false,
      }
    ];

    threads.value = [...mockThreads, ...res.data];

    threads.value.forEach((t) => {
      if (t.id === 'sys-approved') {
        threadPreviews.value[t.id] = {
          preview: "Tu recarga ha sido aprobada exitosamente...",
          time: "12:40 p.m",
          hasUnread: true,
          name: "Mercanto S.A",
          avatarBlobId: null,
          imgSrc: mercantoLogo,
          quoteGroupId: t.quote_group_id
        };
      } else if (t.id === 'sys-rejected') {
        threadPreviews.value[t.id] = {
          preview: "Tu recarga no pudo ser verificada.",
          time: "10:15 a.m",
          hasUnread: false,
          name: "Mercanto S.A",
          avatarBlobId: null,
          imgSrc: mercantoLogo,
          quoteGroupId: t.quote_group_id
        };
      } else if (t.id === 'mock-echamorro') {
        threadPreviews.value[t.id] = {
          preview: "¡Gracias por tu interés! Estamos para ayudarte.",
          time: "11:11 a.m",
          hasUnread: false,
          name: "E. Chamorro S.A",
          avatarBlobId: null,
          imgSrc: echLogo,
          quoteGroupId: t.quote_group_id
        };
      } else if (t.id === 'mock-dicegsa') {
         threadPreviews.value[t.id] = {
          preview: "Entendido, coordinaremos el envío mañana.",
          time: "Ayer",
          hasUnread: false,
          name: "Dicegsa",
          avatarBlobId: null,
          imgSrc: dicegsaLogo,
          quoteGroupId: t.quote_group_id
        };
      } else {
        threadPreviews.value[t.id] = {
          preview: `Pedido: ${t.quote_group_id.substring(0, 8)}...`,
          time: formatUuidv7ToLocalTime(t.updated_at),
          hasUnread: false,
          name: "Cargando...",
          avatarBlobId: null,
          quoteGroupId: t.quote_group_id,
        };
      }
    });

    if (threads.value.length > 0) {
      // Don't auto-select a thread immediately so empty state is shown (Image 1)
      // activeThreadId.value is null by default.
    }

    // Only resolve real threads
    resolveThreadMetadata(res.data);
  } catch (err) {
    console.error("Failed to initialize chat:", err);
  } finally {
    isLoadingThreads.value = false;
  }
});
</script>

<template>
  <!-- Shell -->
  <div class="flex flex-1 min-h-0 w-full h-full overflow-hidden relative bg-[#fde8e4]">
    <!-- Conversations panel -->
    <aside
      class="w-full md:w-[370px] md:min-w-[260px] min-h-0 bg-white border-r border-[#eee] flex-col pt-6 px-4 sm:px-5 pb-4 gap-4 overflow-hidden"
      :class="activeThreadId ? 'hidden md:flex' : 'flex'"
    >
      <h2 class="text-[1.35rem] font-bold text-[#083c5a] m-0 shrink-0">Mensajes</h2>
      <div class="relative shrink-0">
        <input
          v-model="searchQuery"
          class="w-full py-2.5 pl-4 pr-10 border-[1.5px] border-[#d9d9d9] rounded-full text-sm text-[#444] bg-[#f9f9f9] outline-none box-border transition-colors focus:border-[#189c94]"
          placeholder="Buscar por nombre, ID o pedido..."
          type="text"
        />
        <i class="fa-solid fa-magnifying-glass absolute right-3.5 top-1/2 -translate-y-1/2 text-[#888] text-[0.85rem]"></i>
      </div>
      <div class="flex gap-6 border-b-[1.5px] border-[#eee] pb-2 shrink-0">
        <button
          class="bg-transparent border-none text-[0.95rem] font-medium cursor-pointer px-0 pb-1 border-b-[2.5px] border-transparent mb-[-0.58rem] transition-all"
          :class="activeTab === 'todos' ? 'text-[#083c5a] font-bold border-b-[#189c94]' : 'text-[#888]'"
          @click="activeTab = 'todos'"
        >
          Todos
        </button>
        <button
          class="bg-transparent border-none text-[0.95rem] font-medium cursor-pointer px-0 pb-1 border-b-[2.5px] border-transparent mb-[-0.58rem] transition-all"
          :class="activeTab === 'no-leidos' ? 'text-[#083c5a] font-bold border-b-[#189c94]' : 'text-[#888]'"
          @click="activeTab = 'no-leidos'"
        >
          No leídos
        </button>
      </div>
      <ul class="list-none p-0 m-0 overflow-y-auto min-h-0 flex-1 flex flex-col gap-1">
        <li v-if="isLoadingThreads" class="text-center text-[0.85rem] text-[#94a3b8] py-6">Cargando conversaciones...</li>
        <li v-else-if="filteredThreads.length === 0" class="text-center text-[0.85rem] text-[#94a3b8] py-6">No hay conversaciones</li>
        <li
          v-for="conv in filteredThreads"
          :key="conv.id"
          class="flex items-center gap-3.5 p-3 rounded-xl cursor-pointer transition-colors hover:bg-[#f5f5f5] shrink-0"
          :class="{ 'bg-[#fde8e4]': conv.id === activeThreadId }"
          @click="selectThread(conv.id)"
        >
          <!-- Dynamic Avatar based on User Context -->
          <div class="w-12 h-12 rounded-full overflow-hidden border border-[#eee] shrink-0 bg-[#f1f5f9] flex items-center justify-center">
            <img v-if="threadPreviews[conv.id]?.imgSrc" :src="threadPreviews[conv.id]?.imgSrc" class="w-full h-full object-cover" />
            <ProfileAvatar
              v-else-if="!isProvider"
              :blob-id="threadPreviews[conv.id]?.avatarBlobId"
              :alt="threadPreviews[conv.id]?.name"
              class="w-full h-full"
            />
            <ProviderLogo
              v-else
              :blob-id="threadPreviews[conv.id]?.avatarBlobId"
              :alt="threadPreviews[conv.id]?.name"
              class="w-full h-full"
            />
          </div>
          <div class="flex-1 min-w-0 overflow-hidden">
            <div class="flex justify-between items-center">
              <span class="font-bold text-sm text-[#1a1a1a] overflow-hidden text-ellipsis whitespace-nowrap" :title="threadPreviews[conv.id]?.name">
                {{ threadPreviews[conv.id]?.name || 'Cargando...' }}
              </span>
              <span class="text-xs text-[#999] whitespace-nowrap ml-2 shrink-0">
                {{ threadPreviews[conv.id]?.time }}
              </span>
            </div>
            <div class="flex items-center justify-between mt-0.5">
              <span class="text-xs text-[#777] whitespace-nowrap overflow-hidden text-ellipsis block pr-2" :class="{ 'font-semibold text-[#189c94]': threadPreviews[conv.id]?.hasUnread }">
                {{ threadPreviews[conv.id]?.preview }}
              </span>
              <span v-if="threadPreviews[conv.id]?.hasUnread" class="w-2 h-2 rounded-full bg-[#189c94] shrink-0"></span>
            </div>
          </div>
        </li>
      </ul>
    </aside>

    <!-- Chat panel -->
    <section
      class="flex-1 min-w-0 min-h-0 flex-col overflow-hidden w-full md:w-auto"
      :class="[
        activeThreadId ? 'flex' : 'hidden md:flex',
        activeThread?.id.startsWith('sys-') ? 'bg-[#f8fafc]' : 'bg-white'
      ]"
    >
      <template v-if="activeThread">
        <!-- HEADER -->
        <div class="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white border-b border-[#eee] shrink-0">
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="md:hidden text-lg text-[#083c5a] p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
              title="Volver a conversaciones"
              @click="activeThreadId = null"
            >
              <i class="fa-solid fa-arrow-left"></i>
            </button>
            <!-- Dynamic Avatar in Header -->
            <div class="w-10 h-10 sm:w-[50px] sm:h-[50px] rounded-full overflow-hidden border border-[#eee] shrink-0 bg-[#f1f5f9] flex items-center justify-center">
              <img v-if="threadPreviews[activeThread.id]?.imgSrc" :src="threadPreviews[activeThread.id]?.imgSrc" class="w-full h-full object-cover" />
              <ProfileAvatar
                v-else-if="!isProvider"
                :blob-id="threadPreviews[activeThread.id]?.avatarBlobId"
                :alt="threadPreviews[activeThread.id]?.name"
                class="w-full h-full"
              />
              <ProviderLogo
                v-else
                :blob-id="threadPreviews[activeThread.id]?.avatarBlobId"
                :alt="threadPreviews[activeThread.id]?.name"
                class="w-full h-full"
              />
            </div>
            <div class="flex flex-col overflow-hidden min-w-0">
              <span class="font-bold text-sm sm:text-base text-[#1a1a1a] overflow-hidden text-ellipsis whitespace-nowrap">
                {{ threadPreviews[activeThread.id]?.name || 'Cargando...' }}
              </span>
              <span v-if="activeThread.id.startsWith('sys-')" class="text-xs text-[#888] mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                Canal Oficial de Notificaciones
              </span>
              <span v-else class="text-xs text-[#888] flex items-center gap-1 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                #{{ threadPreviews[activeThread.id]?.quoteGroupId?.substring(0, 8) || activeThread.quote_group_id.substring(0, 8) }}

                <!-- Dynamic Status Text & Dot -->
                <span
                  class="w-2 h-2 rounded-full inline-block shrink-0 ml-1"
                  :class="isOnline(threadPreviews[activeThread.id]?.avatarBlobId || threadPreviews[activeThread.id]?.name) ? 'bg-[#22c55e]' : 'bg-[#9ca3af]'"
                ></span>
                <span class="hidden sm:inline">
                  {{ isOnline(threadPreviews[activeThread.id]?.avatarBlobId || threadPreviews[activeThread.id]?.name) ? 'En línea' : 'Desconectado' }}
                </span>
              </span>
            </div>
          </div>
          <div v-if="activeThread.id.startsWith('sys-')" class="px-2.5 py-1 text-[11px] sm:text-xs text-[#64748b] bg-white border border-[#cbd5e1] rounded-full shrink-0">
            Sólo lectura
          </div>
        </div>
        
        <!-- SYSTEM NOTIFICATION CONTENT (RECARGA APROBADA) -->
        <div v-if="activeThread.id === 'sys-approved'" class="flex-1 min-h-0 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div class="bg-white rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-10 max-w-[460px] w-full text-center flex flex-col items-center border border-[#eee]">
            <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#e6f7f5] flex items-center justify-center mb-4 sm:mb-6">
              <i class="fa-solid fa-check text-xl sm:text-2xl text-[#189c94]"></i>
            </div>
            <h2 class="text-xl sm:text-2xl font-bold text-[#083c5a] mb-2 font-serif tracking-tight">¡Recarga aprobada!</h2>
            <p class="text-[#64748b] text-xs sm:text-[0.95rem] mb-6">Tu billetera ha sido recargada exitosamente.</p>
            <div class="text-2xl sm:text-[2.2rem] font-bold text-[#189c94] mb-6 sm:mb-8 tracking-tight">
              + C$ 2,000.00
            </div>
            <div class="w-full bg-[#f8fafc] border border-[#f1f5f9] rounded-xl py-3.5 flex flex-col items-center mb-6 sm:mb-8">
              <span class="text-[0.7rem] text-[#64748b] mb-0.5 uppercase tracking-wide font-semibold">Saldo actual</span>
              <span class="text-base sm:text-lg font-bold text-[#083c5a]">C$ 8,500.00</span>
            </div>
            <button class="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold py-3 sm:py-3.5 rounded-xl transition-colors mb-3 text-sm">
              Ver billetera
            </button>
            <button class="w-full bg-white border border-[#e2e8f0] text-[#083c5a] hover:bg-[#f8fafc] font-semibold py-3 sm:py-3.5 rounded-xl transition-colors text-sm">
              Volver al inicio
            </button>
          </div>
        </div>
        
        <!-- SYSTEM NOTIFICATION CONTENT (RECARGA NO APROBADA) -->
        <div v-else-if="activeThread.id === 'sys-rejected'" class="flex-1 min-h-0 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div class="bg-white rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-10 max-w-[460px] w-full text-center flex flex-col items-center border border-[#eee]">
            <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#fef2f2] flex items-center justify-center mb-4 sm:mb-6">
              <i class="fa-solid fa-xmark text-xl sm:text-2xl text-[#ef4444]"></i>
            </div>
            <h2 class="text-xl sm:text-2xl font-bold text-[#083c5a] mb-2 font-serif tracking-tight">Recarga no aprobada</h2>
            <div class="text-2xl sm:text-[2.2rem] font-bold text-[#ef4444] mb-2 tracking-tight">
              C$ 2,000.00
            </div>
            <p class="text-[#64748b] text-xs sm:text-[0.95rem] mb-6">Tu solicitud <strong>REC-000245</strong> no pudo ser verificada.</p>
            <div class="w-full bg-[#fef2f2] border border-[#fecaca] rounded-xl p-3.5 sm:p-4 flex gap-3 text-left mb-6">
              <i class="fa-solid fa-triangle-exclamation text-[#ef4444] mt-0.5"></i>
              <div class="flex flex-col">
                <span class="text-[#b91c1c] text-[0.75rem] font-bold mb-0.5">Motivo de rechazo</span>
                <span class="text-[#ef4444] text-xs sm:text-[0.85rem] leading-relaxed">La referencia ingresada no coincide con el comprobante de depósito.</span>
              </div>
            </div>
            <div class="w-full text-left mb-6 sm:mb-8">
              <h4 class="text-[#083c5a] font-bold text-xs sm:text-[0.95rem] mb-1">¿Qué podés hacer?</h4>
              <p class="text-[#64748b] text-xs sm:text-[0.85rem] leading-relaxed">Podés registrar nuevamente una recarga con los datos correctos del comprobante original.</p>
            </div>
            <button class="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold py-3 sm:py-3.5 rounded-xl transition-colors mb-3 text-sm">
              Confirmar nueva recarga
            </button>
            <button class="w-full bg-white border border-[#e2e8f0] text-[#083c5a] hover:bg-[#f8fafc] font-semibold py-3 sm:py-3.5 rounded-xl transition-colors text-sm">
              Volver a mi billetera
            </button>
          </div>
        </div>

        <!-- NORMAL CHAT -->
        <div v-else class="flex-1 flex flex-col min-h-0 bg-white">
          <div ref="messagesContainer" class="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 flex flex-col gap-4 bg-white">
            <div class="text-center text-[0.78rem] text-[#aaa] my-2 relative shrink-0 before:content-[''] before:absolute before:top-1/2 before:w-[calc(50%-80px)] before:h-px before:bg-[#e5e5e5] before:left-0 after:content-[''] after:absolute after:top-1/2 after:w-[calc(50%-80px)] after:h-px after:bg-[#e5e5e5] after:right-0">
              Canal Seguro
            </div>
            <div v-if="isLoadingMessages" class="text-center text-[0.85rem] text-[#94a3b8] py-6">Cargando mensajes...</div>
            <div v-else-if="currentMessages.length === 0" class="text-center text-[0.85rem] text-[#94a3b8] py-6">No hay mensajes aún.</div>
            <div
              v-for="msg in currentMessages"
              :key="msg.id"
              class="flex shrink-0"
              :class="msg.sender_id === authStore.account?.id ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[85%] sm:max-w-[65%] md:max-w-[58%] py-2.5 px-3.5 sm:py-3 sm:px-4 rounded-2xl relative"
                :class="msg.sender_id === authStore.account?.id ? 'bg-[#189c94] rounded-br-sm' : 'bg-[#fde8e4] rounded-bl-sm'"
              >
                <p class="m-0 mb-1 text-xs sm:text-[0.88rem] leading-relaxed break-words" :class="msg.sender_id === authStore.account?.id ? 'text-white' : 'text-[#1a1a1a]'">
                  {{ msg.content }}
                </p>
                <span class="text-[0.68rem] block text-right" :class="msg.sender_id === authStore.account?.id ? 'text-white/75' : 'text-[#aaa]'">
                  {{ formatUuidv7ToLocalTime(msg.id) }}
                </span>
              </div>
            </div>
          </div>
          <form class="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 border-t border-[#eee] bg-white shrink-0" @submit.prevent="sendMessage">
            <button type="button" class="bg-transparent border-none cursor-pointer text-lg text-[#aaa] p-1.5 transition-colors shrink-0 hover:text-[#189c94]" title="Adjuntar archivo">
              <i class="fa-solid fa-paperclip"></i>
            </button>
            <input
              v-model="newMessage"
              class="flex-1 border-[1.5px] border-[#e0e0e0] rounded-full py-2 sm:py-2.5 px-4 sm:px-5 text-xs sm:text-sm text-[#333] bg-[#f9f9f9] outline-none transition-colors focus:border-[#189c94] focus:bg-white"
              placeholder="Escribe tu mensaje..."
              type="text"
            />
            <button
              type="submit"
              class="bg-[#189c94] border-none cursor-pointer text-white w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-[0.95rem] shrink-0 transition-all hover:bg-[#147d76] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Enviar"
              :disabled="!newMessage.trim()"
            >
              <i class="fa-solid fa-paper-plane"></i>
            </button>
          </form>
        </div>
      </template>
      <div v-else class="flex-1 flex flex-col items-center justify-center gap-4 text-[#888] p-6 text-center">
        <i class="fa-regular fa-comment text-5xl text-[#cbd5e1]"></i>
        <p class="text-sm sm:text-base">Selecciona una conversación para ver los detalles</p>
      </div>
    </section>
  </div>
</template>

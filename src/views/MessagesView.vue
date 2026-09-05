<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { chatApi, notificationsApi, quoteApi, userProfileApi, organizationApi } from "../api";
import { useAuthStore } from "../modules/auth";
import { useUserContextStore } from "../stores/userContextStore";
import { formatUuidv7ToLocalTime } from "../utils/formatters";
import { NewChatMessageEventSchema } from "../api/services/notifications/payloads";
import type { ChatThreadResponse, ChatMessageResponse } from "../api/services/chat/types";
import ProfileAvatar from "../components/profile/ProfileAvatar.vue";
import ProviderLogo from "../components/organization/ProviderLogo.vue";

const authStore = useAuthStore();
const contextStore = useUserContextStore();

const threads = ref<ChatThreadResponse[]>([]);
const activeThreadId = ref<string | null>(null);
const currentMessages = ref<ChatMessageResponse[]>([]);

interface ThreadPreview {
  preview: string;
  time: string;
  hasUnread: boolean;
  name: string;
  avatarBlobId: string | null;
  quoteGroupId: string;
}

const threadPreviews = ref<Record<string, ThreadPreview>>({});
const searchQuery = ref("");
const activeTab = ref<"todos" | "no-leidos">("todos");
const newMessage = ref("");
const isLoadingThreads = ref(true);
const isLoadingMessages = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
let unsubs: (() => void)[] = [];

const isProvider = computed(() => contextStore.isProvider);
const orgId = computed(() => contextStore.activeOrganizationId);

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
    const matchesTab = activeTab.value === "todos" || (activeTab.value === "no-leidos" && meta?.hasUnread);
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

/**
 * Resolves the "other party" metadata for each thread.
 * - If Provider: Fetches the Buyer's profile (name, avatar)
 * - If Buyer: Fetches the Provider's public info (company name, logo)
 */
const resolveThreadMetadata = async (threadsList: ChatThreadResponse[]) => {
  if (threadsList.length === 0) return;

  // 1. Fetch quote details for each thread to get buyer_id and provider_id
  const quotePromises = threadsList.map(t => {
    if (isProvider.value && orgId.value) {
      return quoteApi.getProviderQuotes(orgId.value, { quote_group_id: t.quote_group_id, limit: 1 }).catch(() => null);
    } else {
      return quoteApi.getMyQuotes({ quote_group_id: t.quote_group_id, limit: 1 }).catch(() => null);
    }
  });

  const quoteResults = await Promise.all(quotePromises);

  const otherPartyIds = new Set<string>();
  const threadQuoteMap = new Map<string, { buyerId: string, providerId: string }>();

  quoteResults.forEach((res, idx) => {
    if (res && res.data.length > 0) {
      const q = res.data[0].quote;
      threadQuoteMap.set(threadsList[idx].id, { buyerId: q.buyer_id, providerId: q.provider_id });
      const otherId = isProvider.value ? q.buyer_id : q.provider_id;
      if (otherId) otherPartyIds.add(otherId);
    }
  });

  // 2. Fetch profiles/logos for the "other party"
  const profilePromises = Array.from(otherPartyIds).map(id => {
    if (isProvider.value) {
      return userProfileApi.getUserProfile(id).then(p => ({ id, type: 'buyer', data: p })).catch(() => null);
    } else {
      return organizationApi.getPublicProvider(id).then(p => ({ id, type: 'provider', data: p })).catch(() => null);
    }
  });

  const profileResults = await Promise.all(profilePromises);
  const profileMap = new Map<string, { type: string, data: any }>();
  profileResults.forEach(res => {
    if (res) profileMap.set(res.id, res);
  });

  // 3. Map data to thread previews
  threadsList.forEach(t => {
    const ids = threadQuoteMap.get(t.id);
    const otherId = isProvider.value ? ids?.buyerId : ids?.providerId;
    const profile = otherId ? profileMap.get(otherId) : null;

    let name = "Usuario";
    let avatarBlobId: string | null = null;

    if (profile) {
      if (profile.type === 'buyer') {
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
      quoteGroupId: t.quote_group_id
    };
  });
};

onMounted(async () => {
  try {
    await authStore.initialize();
    if (!contextStore.isInitialized) {
      await contextStore.initialize();
    }
    await notificationsApi.connect();

    const unsub = notificationsApi.subscribe("NewChatMessage", (rawEvent) => {
      try {
        const event = NewChatMessageEventSchema.parse(rawEvent);
        const existing = threadPreviews.value[event.thread_id];
        threadPreviews.value[event.thread_id] = {
          preview: event.content_preview,
          time: formatUuidv7ToLocalTime(event.message_id),
          hasUnread: activeThreadId.value !== event.thread_id,
          name: existing?.name || "Nuevo Mensaje",
          avatarBlobId: existing?.avatarBlobId || null,
          quoteGroupId: existing?.quoteGroupId || ""
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
      } catch (err) {
        console.error("Malformed NewChatMessage payload:", err);
      }
    });
    unsubs.push(unsub);

    const res = await chatApi.getUserChatThreads({ limit: 50, offset: 0 });
    threads.value = res.data;

    // Initialize default previews before resolving metadata
    threads.value.forEach((t) => {
      threadPreviews.value[t.id] = {
        preview: `Pedido: ${t.quote_group_id.substring(0, 8)}...`,
        time: formatUuidv7ToLocalTime(t.updated_at),
        hasUnread: false,
        name: "Cargando...",
        avatarBlobId: null,
        quoteGroupId: t.quote_group_id
      };
    });

    if (threads.value.length > 0) {
      await selectThread(threads.value[0].id);
    }

    // Resolve metadata in background
    resolveThreadMetadata(threads.value);
  } catch (err) {
    console.error("Failed to initialize chat:", err);
  } finally {
    isLoadingThreads.value = false;
  }
});

onBeforeUnmount(() => {
  unsubs.forEach((fn) => fn());
});
</script>

<template>
  <!-- Shell -->
  <div class="flex flex-1 min-h-0 overflow-hidden relative bg-[#fde8e4] -m-4 w-[calc(100%+2rem)] sm:-m-6 sm:w-[calc(100%+3rem)] lg:-m-10 lg:w-[calc(100%+5rem)] max-md:flex-col">
    <!-- Conversations panel -->
    <aside class="w-[370px] min-w-[260px] min-h-0 bg-white border-r border-[#eee] flex flex-col pt-6 px-5 pb-4 gap-4 overflow-hidden max-md:w-full max-md:min-w-0 max-md:h-2/5 max-md:border-r-0 max-md:border-b">
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
            <ProfileAvatar
              v-if="!isProvider"
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
            <span class="text-xs text-[#777] whitespace-nowrap overflow-hidden text-ellipsis block mt-0.5">
              Pedido: #{{ threadPreviews[conv.id]?.quoteGroupId?.substring(0, 8) || conv.quote_group_id.substring(0, 8) }}
            </span>
          </div>
        </li>
      </ul>
    </aside>

    <!-- Chat panel -->
    <section class="flex-1 min-w-0 min-h-0 flex flex-col bg-white overflow-hidden max-md:h-3/5">
      <template v-if="activeThread">
        <div class="flex items-center gap-4 px-6 py-4 shrink-0">
          <!-- Dynamic Avatar in Header -->
          <div class="w-[50px] h-[50px] rounded-full overflow-hidden border border-[#eee] shrink-0 bg-[#f1f5f9] flex items-center justify-center">
            <ProfileAvatar
              v-if="!isProvider"
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
            <span class="font-bold text-base text-[#1a1a1a] overflow-hidden text-ellipsis whitespace-nowrap">
              {{ threadPreviews[activeThread.id]?.name || 'Cargando...' }}
            </span>
            <span class="text-xs text-[#888] flex items-center gap-1 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
              Pedido: #{{ threadPreviews[activeThread.id]?.quoteGroupId?.substring(0, 8) || activeThread.quote_group_id.substring(0, 8) }}
              <span class="w-2 h-2 rounded-full bg-[#22c55e] inline-block shrink-0"></span>
              <span class="text-[#888]">En línea</span>
            </span>
          </div>
        </div>
        <div class="h-px bg-[#eee] mx-6 shrink-0"></div>
        <div ref="messagesContainer" class="flex-1 min-h-0 overflow-y-auto px-8 py-6 flex flex-col gap-4 bg-white max-md:px-4">
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
              class="max-w-[58%] py-3 px-4 rounded-2xl relative max-md:max-w-[80%]"
              :class="msg.sender_id === authStore.account?.id ? 'bg-[#189c94] rounded-br-sm' : 'bg-[#fde8e4] rounded-bl-sm'"
            >
              <p class="m-0 mb-1.5 text-[0.88rem] leading-relaxed break-words" :class="msg.sender_id === authStore.account?.id ? 'text-white' : 'text-[#1a1a1a]'">
                {{ msg.content }}
              </p>
              <span class="text-[0.7rem] block text-right" :class="msg.sender_id === authStore.account?.id ? 'text-white/75' : 'text-[#aaa]'">
                {{ formatUuidv7ToLocalTime(msg.id) }}
              </span>
            </div>
          </div>
        </div>
        <form class="flex items-center gap-3 px-6 py-4 border-t border-[#eee] bg-white shrink-0" @submit.prevent="sendMessage">
          <button type="button" class="bg-transparent border-none cursor-pointer text-lg text-[#aaa] p-1 transition-colors shrink-0 hover:text-[#189c94]" title="Adjuntar archivo">
            <i class="fa-solid fa-paperclip"></i>
          </button>
          <input
            v-model="newMessage"
            class="flex-1 border-[1.5px] border-[#e0e0e0] rounded-full py-2.5 px-5 text-sm text-[#333] bg-[#f9f9f9] outline-none transition-colors focus:border-[#189c94] focus:bg-white"
            placeholder="Escribe tu mensaje..."
            type="text"
          />
          <button
            type="submit"
            class="bg-[#189c94] border-none cursor-pointer text-white w-10 h-10 rounded-full flex items-center justify-center text-[0.95rem] shrink-0 transition-all hover:bg-[#147d76] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Enviar"
            :disabled="!newMessage.trim()"
          >
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </form>
      </template>
      <div v-else class="flex-1 flex flex-col items-center justify-center gap-4 text-[#888]">
        <i class="fa-regular fa-comments text-5xl text-[#cbd5e1]"></i>
        <p>Selecciona una conversación para ver los mensajes</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { chatApi, notificationsApi } from "../api";
import { useAuthStore } from "../modules/auth";
import { formatUuidv7ToLocalTime } from "../utils/formatters";
import { NewChatMessageEventSchema } from "../api/services/notifications/payloads";
import type { ChatThreadResponse, ChatMessageResponse } from "../api/services/chat/types";

const authStore = useAuthStore();

const threads = ref<ChatThreadResponse[]>([]);
const activeThreadId = ref<string | null>(null);
const currentMessages = ref<ChatMessageResponse[]>([]);
const threadPreviews = ref<Record<string, { preview: string; time: string; hasUnread: boolean }>>({});

const searchQuery = ref("");
const activeTab = ref<"todos" | "no-leidos">("todos");
const newMessage = ref("");

const isLoadingThreads = ref(true);
const isLoadingMessages = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);

let unsubs: (() => void)[] = [];

function getAvatarColor(id: string): string {
  const colors = ["#189c94", "#083c5a", "#ff6a00", "#7c3aed", "#0284c7"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
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
    const matchesSearch = t.id.toLowerCase().includes(query) || t.quote_group_id.toLowerCase().includes(query);
    const meta = threadPreviews.value[t.id];
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

    threadPreviews.value[targetThreadId] = {
      preview: text,
      time: formatUuidv7ToLocalTime(sentMsg.id),
      hasUnread: false,
    };

    scrollToBottom();
  } catch (err) {
    console.error("Failed to send chat message:", err);
  }
}

onMounted(async () => {
  try {
    await authStore.initialize();
    await notificationsApi.connect();

    const unsub = notificationsApi.subscribe("NewChatMessage", (rawEvent) => {
      try {
        const event = NewChatMessageEventSchema.parse(rawEvent);

        threadPreviews.value[event.thread_id] = {
          preview: event.content_preview,
          time: formatUuidv7ToLocalTime(event.message_id),
          hasUnread: activeThreadId.value !== event.thread_id,
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

    threads.value.forEach((t) => {
      threadPreviews.value[t.id] = {
        preview: `Cotización: ${t.quote_group_id.substring(0, 8)}...`,
        time: formatUuidv7ToLocalTime(t.updated_at),
        hasUnread: false,
      };
    });

    if (threads.value.length > 0) {
      await selectThread(threads.value[0].id);
    }
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
  <div class="messages-shell">
    <!-- Conversations panel -->
    <aside class="conv-panel">
      <h2 class="conv-title">Mensajes</h2>

      <div class="search-wrap">
        <input
          v-model="searchQuery"
          class="search-input"
          placeholder="Buscar conversación por ID"
          type="text"
        />
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
      </div>

      <div class="tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'todos' }"
          @click="activeTab = 'todos'"
        >
          Todos
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'no-leidos' }"
          @click="activeTab = 'no-leidos'"
        >
          No leídos
        </button>
      </div>

      <ul class="conv-list">
        <li v-if="isLoadingThreads" class="empty-hint">Cargando conversaciones...</li>
        <li v-else-if="filteredThreads.length === 0" class="empty-hint">No hay conversaciones</li>

        <li
          v-for="conv in filteredThreads"
          :key="conv.id"
          class="conv-item"
          :class="{ 'conv-item--active': conv.id === activeThreadId }"
          @click="selectThread(conv.id)"
        >
          <div
            class="conv-avatar"
            :style="{ backgroundColor: getAvatarColor(conv.id) }"
          >
            {{ conv.id.substring(0, 2).toUpperCase() }}
          </div>
          <div class="conv-info">
            <div class="conv-name-row">
              <span class="conv-name" :title="conv.id">{{ conv.id }}</span>
              <span class="conv-time">{{ threadPreviews[conv.id]?.time }}</span>
            </div>
            <span class="conv-preview">{{ threadPreviews[conv.id]?.preview }}</span>
          </div>
        </li>
      </ul>
    </aside>

    <!-- Chat panel -->
    <section class="chat-panel">
      <template v-if="activeThread">
        <div class="chat-header">
          <div
            class="chat-avatar"
            :style="{ backgroundColor: getAvatarColor(activeThread.id) }"
          >
            {{ activeThread.id.substring(0, 2).toUpperCase() }}
          </div>
          <div class="chat-contact">
            <span class="chat-name">{{ activeThread.id }}</span>
            <span class="chat-meta">
              Quote Group: {{ activeThread.quote_group_id }}
              <span class="status-dot online"></span>
              <span class="status-label">En línea</span>
            </span>
          </div>
        </div>

        <div class="chat-divider"></div>

        <div ref="messagesContainer" class="chat-messages">
          <div class="date-separator">Canal Seguro</div>

          <div v-if="isLoadingMessages" class="empty-hint">Cargando mensajes...</div>
          <div v-else-if="currentMessages.length === 0" class="empty-hint">No hay mensajes aún.</div>

          <div
            v-for="msg in currentMessages"
            :key="msg.id"
            class="msg-wrap"
            :class="msg.sender_id === authStore.account?.id ? 'msg-wrap--me' : 'msg-wrap--them'"
          >
            <div
              class="msg-bubble"
              :class="msg.sender_id === authStore.account?.id ? 'bubble-me' : 'bubble-them'"
            >
              <p class="msg-text">{{ msg.content }}</p>
              <span class="msg-time">{{ formatUuidv7ToLocalTime(msg.id) }}</span>
            </div>
          </div>
        </div>

        <form class="chat-input-bar" @submit.prevent="sendMessage">
          <button type="button" class="attach-btn" title="Adjuntar archivo">
            <i class="fa-solid fa-paperclip"></i>
          </button>
          <input
            v-model="newMessage"
            class="chat-input"
            placeholder="Escribe tu mensaje..."
            type="text"
          />
          <button type="submit" class="send-btn" title="Enviar" :disabled="!newMessage.trim()">
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </form>
      </template>

      <div v-else class="no-thread-selected">
        <i class="fa-regular fa-comments empty-chat-icon"></i>
        <p>Selecciona una conversación para ver los mensajes</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Shell */
.messages-shell {
  display: flex;
  height: calc(100vh - 64px);
  max-height: calc(100vh - 64px);
  margin: -2.5rem -3rem;
  background: #fde8e4;
  overflow: hidden;
  position: relative;
}

/* Parent container overflow suppression */
:global(body:has(.messages-shell)),
:global(main:has(.messages-shell)),
:global(.content:has(.messages-shell)) {
  overflow: hidden !important;
}

/* Conversations panel */
.conv-panel {
  width: 370px;
  min-width: 260px;
  min-height: 0;
  background: #ffffff;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1.25rem 1rem;
  gap: 1rem;
  overflow: hidden;
}

.conv-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #083c5a;
  margin: 0;
  flex-shrink: 0;
}

.search-wrap {
  position: relative;
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  padding: 0.6rem 2.5rem 0.6rem 1rem;
  border: 1.5px solid #d9d9d9;
  border-radius: 30px;
  font-size: 0.9rem;
  color: #444;
  background: #f9f9f9;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #189c94;
}

.search-icon {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #888;
  font-size: 0.85rem;
}

.tabs {
  display: flex;
  gap: 1.5rem;
  border-bottom: 1.5px solid #eee;
  padding-bottom: 0.5rem;
  flex-shrink: 0;
}

.tab-btn {
  background: none;
  border: none;
  font-size: 0.95rem;
  font-weight: 500;
  color: #888;
  cursor: pointer;
  padding: 0 0 0.4rem;
  border-bottom: 2.5px solid transparent;
  margin-bottom: -0.58rem;
  transition: all 0.2s;
}

.tab-btn.active {
  color: #083c5a;
  font-weight: 700;
  border-bottom-color: #189c94;
}

.conv-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.conv-item {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.75rem 0.75rem;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.18s;
  flex-shrink: 0;
}

.conv-item:hover {
  background: #f5f5f5;
}

.conv-item--active {
  background: #fde8e4;
}

.conv-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  letter-spacing: 0.5px;
}

.conv-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.conv-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conv-name {
  font-weight: 700;
  font-size: 0.9rem;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-time {
  font-size: 0.75rem;
  color: #999;
  white-space: nowrap;
  margin-left: 0.5rem;
  flex-shrink: 0;
}

.conv-preview {
  font-size: 0.8rem;
  color: #777;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  margin-top: 0.15rem;
}

/* Chat panel */
.chat-panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.5rem;
  flex-shrink: 0;
}

.chat-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.chat-contact {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.chat-name {
  font-weight: 700;
  font-size: 1rem;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-meta {
  font-size: 0.8rem;
  color: #888;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
  display: inline-block;
  flex-shrink: 0;
}

.status-dot.online {
  background: #22c55e;
}

.status-label {
  color: #888;
}

.chat-divider {
  height: 1px;
  background: #eee;
  margin: 0 1.5rem;
  flex-shrink: 0;
}

.chat-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #ffffff;
}

.date-separator {
  text-align: center;
  font-size: 0.78rem;
  color: #aaa;
  margin: 0.5rem 0;
  position: relative;
  flex-shrink: 0;
}

.date-separator::before,
.date-separator::after {
  content: "";
  position: absolute;
  top: 50%;
  width: calc(50% - 80px);
  height: 1px;
  background: #e5e5e5;
}

.date-separator::before {
  left: 0;
}

.date-separator::after {
  right: 0;
}

.msg-wrap {
  display: flex;
  flex-shrink: 0;
}

.msg-wrap--me {
  justify-content: flex-end;
}

.msg-wrap--them {
  justify-content: flex-start;
}

.msg-bubble {
  max-width: 58%;
  padding: 0.75rem 1rem;
  border-radius: 16px;
  position: relative;
}

.bubble-me {
  background: #189c94;
  border-bottom-right-radius: 4px;
}

.bubble-them {
  background: #fde8e4;
  border-bottom-left-radius: 4px;
}

.msg-text {
  margin: 0 0 0.35rem;
  font-size: 0.88rem;
  line-height: 1.5;
  word-break: break-word;
}

.bubble-me .msg-text {
  color: #ffffff;
}

.bubble-them .msg-text {
  color: #1a1a1a;
}

.msg-time {
  font-size: 0.7rem;
  display: block;
  text-align: right;
}

.bubble-me .msg-time {
  color: rgba(255, 255, 255, 0.75);
}

.bubble-them .msg-time {
  color: #aaa;
}

.chat-input-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
  background: #fff;
  flex-shrink: 0;
}

.attach-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  color: #aaa;
  padding: 0.3rem;
  transition: color 0.2s;
  flex-shrink: 0;
}

.attach-btn:hover {
  color: #189c94;
}

.chat-input {
  flex: 1;
  border: 1.5px solid #e0e0e0;
  border-radius: 30px;
  padding: 0.65rem 1.2rem;
  font-size: 0.9rem;
  color: #333;
  background: #f9f9f9;
  outline: none;
  transition: border-color 0.2s;
}

.chat-input:focus {
  border-color: #189c94;
  background: #fff;
}

.send-btn {
  background: #189c94;
  border: none;
  cursor: pointer;
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  flex-shrink: 0;
  transition: background 0.2s, transform 0.15s;
}

.send-btn:hover:not(:disabled) {
  background: #147d76;
  transform: scale(1.05);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.no-thread-selected {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #888;
}

.empty-chat-icon {
  font-size: 3rem;
  color: #cbd5e1;
}

.empty-hint {
  text-align: center;
  font-size: 0.85rem;
  color: #94a3b8;
  padding: 1.5rem 0;
}

/* Responsive */
@media (max-width: 900px) {
  .messages-shell {
    margin: -2.5rem -1.5rem;
  }

  .conv-panel {
    width: 280px;
    min-width: 220px;
  }
}

@media (max-width: 680px) {
  .messages-shell {
    margin: -2.5rem -1rem;
    flex-direction: column;
  }

  .conv-panel {
    width: 100%;
    min-width: unset;
    height: 40%;
    border-right: none;
    border-bottom: 1px solid #eee;
  }

  .chat-panel {
    height: 60%;
  }

  .msg-bubble {
    max-width: 80%;
  }
}
</style>

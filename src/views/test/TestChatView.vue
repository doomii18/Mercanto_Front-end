<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { chatApi, notificationsApi } from '../../api';
import { NewChatMessageEventSchema } from '../../api/services/notifications/payloads';
import type { ChatThreadResponse, ChatMessageResponse } from '../../api/services/chat/types';

const threads = ref<ChatThreadResponse[]>([]);
const currentMessages = ref<ChatMessageResponse[]>([]);
const currentThreadId = ref<string | null>(null);
const messageInput = ref("");
const isLoadingThreads = ref(true);
const isLoadingMessages = ref(false);
const errorState = ref("");

let unsubs: (() => void)[] = [];

onMounted(async () => {
  try {

    await notificationsApi.connect();

    const unsub = notificationsApi.subscribe("NewChatMessage", (rawEvent) => {
      try {
        const event = NewChatMessageEventSchema.parse(rawEvent);
        if (currentThreadId.value && event.thread_id === currentThreadId.value) {
          // Optimistically append WS event data
          currentMessages.value.push({
            id: event.message_id,
            thread_id: event.thread_id,
            sender_id: event.sender_id,
            content: event.content_preview,
            is_read: false
          });
        }
      } catch (err) {
        console.error("Malformed NewChatMessage payload:", err);
      }
    });
    unsubs.push(unsub);

    const res = await chatApi.getUserChatThreads({ limit: 50, offset: 0 });
    threads.value = res.data;
  } catch (err: any) {
    errorState.value = err.message || "Failed to load chat setup.";
  } finally {
    isLoadingThreads.value = false;
  }
});

onBeforeUnmount(() => {
  unsubs.forEach(fn => fn());
});

const selectThread = async (threadId: string) => {
  currentThreadId.value = threadId;
  isLoadingMessages.value = true;
  currentMessages.value = [];
  try {
    const res = await chatApi.getThreadMessages(threadId, { limit: 50, offset: 0 });
    // reverse to display chronological top-to-bottom
    currentMessages.value = res.data.reverse();
  } catch (err) {
    console.error(err);
  } finally {
    isLoadingMessages.value = false;
  }
};

const sendMessage = async () => {
  if (!currentThreadId.value || !messageInput.value.trim()) return;
  try {
    const content = messageInput.value;
    messageInput.value = "";
    await chatApi.publishChatMessage(currentThreadId.value, { content });
  } catch (err) {
    console.error("Send failed:", err);
  }
};
</script>

<template>
  <div class="chat-test-layout">
    <div class="sidebar">
      <h3>Threads</h3>
      <p v-if="isLoadingThreads">Loading...</p>
      <p v-else-if="errorState" class="error">{{ errorState }}</p>
      <div class="thread-list">
        <div
          v-for="t in threads"
          :key="t.id"
          :class="['thread-item', { active: t.id === currentThreadId }]"
          @click="selectThread(t.id)"
        >
          <strong>ID: {{ t.id.substring(0,8) }}...</strong>
          <small>Quote: {{ t.quote_group_id.substring(0,8) }}...</small>
        </div>
      </div>
    </div>

    <div class="main-chat">
      <h3>Messages {{ currentThreadId ? `(${currentThreadId.substring(0,8)}...)` : '' }}</h3>
      <div class="message-list">
        <p v-if="isLoadingMessages">Loading messages...</p>
        <p v-else-if="currentThreadId && currentMessages.length === 0">No messages yet.</p>
        <p v-else-if="!currentThreadId">Select a thread</p>

        <div
          v-for="msg in currentMessages"
          :key="msg.id"
          :class="['message-item', msg.is_read ? 'read' : 'unread']"
        >
          <span class="sender">{{ msg.sender_id.substring(0,6) }}:</span>
          <span class="content">{{ msg.content }}</span>
        </div>
      </div>

      <form @submit.prevent="sendMessage" class="chat-form">
        <input v-model="messageInput" type="text" placeholder="Type a message..." :disabled="!currentThreadId" />
        <button type="submit" :disabled="!currentThreadId || !messageInput">Send</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.chat-test-layout {
  display: flex;
  height: 600px;
  border: 1px solid var(--border-gray);
  border-radius: 8px;
}
.sidebar {
  width: 250px;
  border-right: 1px solid var(--border-gray);
  padding: 1rem;
  overflow-y: auto;
}
.thread-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.thread-item {
  padding: 0.5rem;
  border: 1px solid var(--border-gray);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}
.thread-item.active, .thread-item:hover {
  background: var(--bg-gray);
  border-color: var(--light-teal);
}
.main-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
}
.message-list {
  flex: 1;
  overflow-y: auto;
  border: 1px solid var(--border-gray);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.message-item {
  padding: 0.5rem 1rem;
  border-radius: 12px;
  background: var(--bg-gray);
  width: fit-content;
  max-width: 80%;
}
.message-item.unread {
  border-left: 3px solid var(--primary-orange);
}
.sender {
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--light-teal);
  display: block;
  margin-bottom: 0.2rem;
}
.chat-form {
  display: flex;
  gap: 1rem;
}
.chat-form input {
  flex: 1;
  padding: 0.8rem;
  border: 1px solid var(--border-gray);
  border-radius: 8px;
}
.chat-form button {
  padding: 0 1.5rem;
  background: var(--primary-orange);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.chat-form button:disabled {
  opacity: 0.5;
}
.error { color: #d9534f; }
</style>

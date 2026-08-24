<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { authManager } from '../../modules/auth';
import { notificationsApi } from '../../api';
import type { NotificationEvent } from '../../api/services/notifications/types';

const events = ref<NotificationEvent[]>([]);
const isConnected = ref(false);
let unsub: (() => void) | null = null;

onMounted(async () => {
  try {
    await authManager.requireAuth();
    await notificationsApi.connect();
    isConnected.value = true;

    unsub = notificationsApi.subscribeAll((ev) => {
      events.value.unshift(ev); // Prepend to show newest first
      if (events.value.length > 50) events.value.pop();
    });
  } catch (err) {
    console.error("Event connection failed", err);
  }
});

onBeforeUnmount(() => {
  if (unsub) unsub();
});
</script>

<template>
  <div>
    <h3>Global WebSocket Events</h3>
    <p>Status: <strong :style="{ color: isConnected ? 'green' : 'red' }">{{ isConnected ? 'Connected' : 'Disconnected' }}</strong></p>

    <div class="event-log">
      <div v-for="ev in events" :key="ev.notification_id" class="event-item">
        <span class="badge">{{ ev.type }}</span>
        <pre>{{ JSON.stringify(ev, null, 2) }}</pre>
      </div>
      <p v-if="!events.length">Waiting for events...</p>
    </div>
  </div>
</template>

<style scoped>
.event-log {
  margin-top: 1rem;
  background: var(--bg-gray);
  padding: 1rem;
  border-radius: 8px;
  height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.event-item {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid var(--primary-blue);
}
.badge {
  background: var(--light-teal);
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}
pre {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>

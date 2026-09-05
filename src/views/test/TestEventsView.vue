<script setup lang="ts">
import { useNotificationStore } from '@/stores/notificationStore';

const notificationStore = useNotificationStore();
</script>

<template>
  <div>
    <h3>Global WebSocket Events</h3>
    <p>
      Status:
      <strong :style="{ color: notificationStore.isConnected ? 'green' : 'red' }">
        {{ notificationStore.isConnected ? 'Connected' : 'Disconnected' }}
      </strong>
      <span v-if="notificationStore.isConnecting" style="color: orange; margin-left: 0.5rem;">
        (Connecting...)
      </span>
    </p>

    <div v-if="notificationStore.connectionError" style="color: red; margin-bottom: 1rem;">
      Error: {{ notificationStore.connectionError.message }}
      <button @click="notificationStore.connect()" style="margin-left: 0.5rem; cursor: pointer; text-decoration: underline;">
        Retry
      </button>
    </div>

    <div class="event-log">
      <div v-for="ev in notificationStore.recentEvents" :key="ev.notification_id" class="event-item">
        <span class="badge">{{ ev.type }}</span>
        <pre>{{ JSON.stringify(ev, null, 2) }}</pre>
      </div>
      <p v-if="!notificationStore.recentEvents.length">Waiting for events...</p>
    </div>

    <button
      v-if="notificationStore.recentEvents.length"
      @click="notificationStore.clearEvents()"
      style="margin-top: 1rem; padding: 0.4rem 0.8rem; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;"
    >
      Clear Log
    </button>
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

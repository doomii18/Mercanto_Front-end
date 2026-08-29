<script setup lang="ts">
import { ref, computed } from "vue";

/* ─── Types ─────────────────────────────────────────────── */
interface Message {
  id: number;
  text: string;
  time: string;
  fromMe: boolean;
}

interface Conversation {
  id: number;
  name: string;
  role: string;
  initials: string;
  avatarColor: string;
  logoText: string;
  preview: string;
  time: string;
  online: boolean;
  messages: Message[];
}

/* ─── Data ───────────────────────────────────────────────── */
const conversations = ref<Conversation[]>([
  {
    id: 1,
    name: "E. Chamorro S.A",
    role: "Proveedor",
    initials: "ECh",
    avatarColor: "#189c94",
    logoText: "ECh",
    preview: "¡Gracias por tu interés! Estamos para ayudarte.",
    time: "11:11 a.m.",
    online: true,
    messages: [
      {
        id: 1,
        text: "Hola. Buenos días. Realicé el pedido #MC-2024-0012 y quería confirmar cuándo será enviado.",
        time: "1:30 p.m.",
        fromMe: true,
      },
      {
        id: 2,
        text: "¡Hola! Buenos días. Gracias por tu compra. Ya recibimos tu pedido y actualmente estamos preparando los productos para el envío.",
        time: "1:50 p.m.",
        fromMe: false,
      },
      {
        id: 3,
        text: "Perfecto, muchas gracias. ¿Podrían indicarme la fecha estimada de entrega?",
        time: "2:00 p.m.",
        fromMe: true,
      },
      {
        id: 4,
        text: "Claro. Tenemos programado despacharlo mañana por la mañana. El tiempo estimado de entrega es de 2 a 3 días hábiles, dependiendo de la ubicación.",
        time: "2:20 p.m.",
        fromMe: false,
      },
      {
        id: 5,
        text: "Excelente. ¿Cuando sea enviado recibiré un número de seguimiento?",
        time: "2:24 p.m.",
        fromMe: true,
      },
    ],
  },
  {
    id: 2,
    name: "Dicegsa",
    role: "Proveedor",
    initials: "D",
    avatarColor: "#083c5a",
    logoText: "Dicegsa",
    preview: "¡Gracias por tu interés! Estamos para ayudarte.",
    time: "11:11 a.m.",
    online: false,
    messages: [
      {
        id: 1,
        text: "Buenos días, quisiera saber si tienen disponibilidad del producto Aceite Industrial 5L.",
        time: "10:00 a.m.",
        fromMe: true,
      },
      {
        id: 2,
        text: "¡Gracias por tu interés! Estamos para ayudarte.",
        time: "11:11 a.m.",
        fromMe: false,
      },
    ],
  },
]);

const activeConvId = ref<number>(1);
const searchQuery = ref("");
const activeTab = ref<"todos" | "no-leidos">("todos");
const newMessage = ref("");

const activeConv = computed(
  () => conversations.value.find((c) => c.id === activeConvId.value)!
);

const filteredConvs = computed(() => {
  return conversations.value.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

function selectConv(id: number) {
  activeConvId.value = id;
}

function sendMessage() {
  const text = newMessage.value.trim();
  if (!text) return;
  const conv = conversations.value.find((c) => c.id === activeConvId.value);
  if (!conv) return;
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "p.m." : "a.m.";
  const hour = h % 12 || 12;
  conv.messages.push({
    id: Date.now(),
    text,
    time: `${hour}:${m} ${ampm}`,
    fromMe: true,
  });
  conv.preview = text;
  conv.time = `${hour}:${m} ${ampm}`;
  newMessage.value = "";
}
</script>

<template>
  <div class="messages-shell">
    <!-- ── Conversations panel ─────────────────────── -->
    <aside class="conv-panel">
      <h2 class="conv-title">Mensajes</h2>

      <!-- Search -->
      <div class="search-wrap">
        <input
          v-model="searchQuery"
          class="search-input"
          placeholder="Buscar conversación"
          type="text"
        />
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
      </div>

      <!-- Tabs -->
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

      <!-- Conversation list -->
      <ul class="conv-list">
        <li
          v-for="conv in filteredConvs"
          :key="conv.id"
          class="conv-item"
          :class="{ 'conv-item--active': conv.id === activeConvId }"
          @click="selectConv(conv.id)"
        >
          <div
            class="conv-avatar"
            :style="{ backgroundColor: conv.avatarColor }"
          >
            {{ conv.initials }}
          </div>
          <div class="conv-info">
            <div class="conv-name-row">
              <span class="conv-name">{{ conv.name }}</span>
              <span class="conv-time">{{ conv.time }}</span>
            </div>
            <span class="conv-preview">{{ conv.preview }}</span>
          </div>
        </li>
      </ul>
    </aside>

    <!-- ── Chat panel ──────────────────────────────── -->
    <section class="chat-panel">
      <!-- Chat header -->
      <div class="chat-header">
        <div
          class="chat-avatar"
          :style="{ backgroundColor: activeConv.avatarColor }"
        >
          {{ activeConv.initials }}
        </div>
        <div class="chat-contact">
          <span class="chat-name">{{ activeConv.name }}</span>
          <span class="chat-meta">
            {{ activeConv.role }}
            <span class="status-dot" :class="{ online: activeConv.online }"></span>
            <span class="status-label">{{
              activeConv.online ? "En línea" : "Desconectado"
            }}</span>
          </span>
        </div>
      </div>

      <div class="chat-divider"></div>

      <!-- Messages -->
      <div class="chat-messages">
        <div class="date-separator">09 de julio de 2026</div>

        <div
          v-for="msg in activeConv.messages"
          :key="msg.id"
          class="msg-wrap"
          :class="msg.fromMe ? 'msg-wrap--me' : 'msg-wrap--them'"
        >
          <div class="msg-bubble" :class="msg.fromMe ? 'bubble-me' : 'bubble-them'">
            <p class="msg-text">{{ msg.text }}</p>
            <span class="msg-time">{{ msg.time }}</span>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="chat-input-bar">
        <button class="attach-btn" title="Adjuntar archivo">
          <i class="fa-solid fa-paperclip"></i>
        </button>
        <input
          v-model="newMessage"
          class="chat-input"
          placeholder="Escribe tu mensaje..."
          type="text"
          @keyup.enter="sendMessage"
        />
        <button class="send-btn" @click="sendMessage" title="Enviar">
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ── Shell ──────────────────────────────────────────── */
.messages-shell {
  display: flex;
  height: calc(100vh - 64px);
  margin: -2.5rem -3rem;
  background: #fde8e4;
  overflow: hidden;
}

/* ── Conversations panel ────────────────────────────── */
.conv-panel {
  width: 370px;
  min-width: 260px;
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
}

/* Search */
.search-wrap {
  position: relative;
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

/* Tabs */
.tabs {
  display: flex;
  gap: 1.5rem;
  border-bottom: 1.5px solid #eee;
  padding-bottom: 0.5rem;
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

/* Conversation list */
.conv-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
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
}

.conv-time {
  font-size: 0.75rem;
  color: #999;
  white-space: nowrap;
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

/* ── Chat panel ─────────────────────────────────────── */
.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
}

/* Chat header */
.chat-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.5rem;
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
}

.chat-name {
  font-weight: 700;
  font-size: 1rem;
  color: #1a1a1a;
}

.chat-meta {
  font-size: 0.8rem;
  color: #888;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.1rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
  display: inline-block;
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
}

/* Messages area */
.chat-messages {
  flex: 1;
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

/* Message wrappers */
.msg-wrap {
  display: flex;
}

.msg-wrap--me {
  justify-content: flex-end;
}

.msg-wrap--them {
  justify-content: flex-start;
}

/* Bubbles */
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

/* Input bar */
.chat-input-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
  background: #fff;
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

.send-btn:hover {
  background: #147d76;
  transform: scale(1.05);
}

/* ── Responsive ─────────────────────────────────────── */
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
    height: 45%;
    border-right: none;
    border-bottom: 1px solid #eee;
  }

  .chat-panel {
    height: 55%;
  }

  .msg-bubble {
    max-width: 80%;
  }
}
</style>

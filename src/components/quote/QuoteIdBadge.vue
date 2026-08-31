<script setup lang="ts">
import { ref, computed } from "vue";
import { uuidToCrockford } from "../../utils/formatters";

const props = withDefaults(
  defineProps<{
    quoteId: string;
    size?: "sm" | "lg";
  }>(),
  {
    size: "sm",
  }
);

const copied = ref(false);

const chunks = computed(() => {
  if (!props.quoteId) return [];
  const encoded = uuidToCrockford(props.quoteId);
  return encoded.split("-");
});

const copyFullId = async () => {
  if (!props.quoteId) return;
  await navigator.clipboard.writeText(props.quoteId);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
};
</script>

<template>
  <button
    type="button"
    :class="['quote-badge-btn', size, { 'is-copied': copied }]"
    :title="copied ? '¡ID copiado al portapapeles!' : `Copiar UUID completo: ${quoteId}`"
    :aria-label="copied ? 'ID copiado al portapapeles' : `Copiar ID: ${quoteId}`"
    @click.stop="copyFullId"
  >
    <div class="badge-chunks">
      <template v-for="(chunk, idx) in chunks" :key="idx">
        <span class="badge-chunk">{{ chunk }}</span>
        <span v-if="idx < chunks.length - 1" class="chunk-sep">-</span>
      </template>
    </div>

    <span class="icon-slot">
      <i :class="copied ? 'fa-solid fa-check icon-success' : 'fa-regular fa-copy icon-copy'"></i>
    </span>
  </button>
</template>

<style scoped>
.quote-badge-btn {
  display: inline-flex;
  align-items: center;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.25rem 0.55rem;
  cursor: pointer;
  max-width: 100%;
  text-align: left;
  transition: background-color 0.2s ease, border-color 0.2s ease;
  user-select: none;
}

.quote-badge-btn:hover {
  background-color: #e2e8f0;
  border-color: var(--light-teal, #189c94);
}

.quote-badge-btn.is-copied {
  background-color: #e6f7f5;
  border-color: var(--light-teal, #189c94);
}

/* Typography & Chunks */
.badge-chunks {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  font-family: "Lato", sans-serif;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--primary-blue, #083c5a);
}

.badge-chunk {
  white-space: nowrap;
}

.chunk-sep {
  color: #94a3b8;
  margin: 0 0.1rem;
}

/* Collapsible Icon Slot */
.icon-slot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0;
  opacity: 0;
  overflow: hidden;
  margin-left: 0;
  flex-shrink: 0;
  transition: width 0.18s ease, opacity 0.18s ease, margin-left 0.18s ease;
}

.quote-badge-btn:hover .icon-slot,
.quote-badge-btn.is-copied .icon-slot {
  width: 14px;
  opacity: 1;
  margin-left: 0.4rem;
}

.icon-copy {
  color: var(--light-teal, #189c94);
  font-size: 0.8rem;
}

.icon-success {
  color: #10b981;
  font-size: 0.85rem;
  animation: pop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Sizing Modifiers */
.quote-badge-btn.lg {
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
}

.quote-badge-btn.lg .badge-chunks {
  font-size: 1.05rem;
}

.quote-badge-btn.sm .badge-chunks {
  font-size: 0.82rem;
}

@keyframes pop {
  0% { transform: scale(0.5); }
  100% { transform: scale(1); }
}
</style>

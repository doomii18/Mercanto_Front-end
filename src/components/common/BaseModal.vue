<script setup lang="ts">
import { watch, onBeforeUnmount } from "vue";

interface Props {
  modelValue: boolean;
  maxWidth?: string;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  maxWidth: "480px",
  closeOnBackdrop: true,
  closeOnEsc: true,
  showCloseButton: true,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "close"): void;
}>();

const close = () => {
  emit("update:modelValue", false);
  emit("close");
};

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) close();
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && props.modelValue && props.closeOnEsc) {
    close();
  }
};

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeydown);
    } else {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeydown);
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  document.body.style.overflow = "";
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="modelValue"
        class="modal-backdrop"
        role="dialog"
        aria-modal="true"
        @click.self="handleBackdropClick"
      >
        <div class="modal-card" :style="{ maxWidth }">
          <button
            v-if="showCloseButton"
            type="button"
            class="btn-close-modal"
            aria-label="Cerrar modal"
            @click="close"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>

          <header v-if="$slots.header" class="modal-header">
            <slot name="header" />
          </header>

          <main class="modal-body">
            <slot />
          </main>

          <footer v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template><style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  width: 100%;
  position: relative;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
}

.btn-close-modal {
  position: absolute;
  top: 14px;
  right: 14px;
  background: transparent;
  border: 2px solid var(--primary-orange);
  color: var(--primary-orange);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.15s ease;
}

.btn-close-modal:hover {
  transform: scale(1.05);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-card,
.modal-fade-leave-active .modal-card {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-enter-from .modal-card,
.modal-fade-leave-to .modal-card {
  transform: scale(0.95);
}
</style>

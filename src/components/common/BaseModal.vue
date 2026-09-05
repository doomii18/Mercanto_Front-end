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
        class="fixed inset-0 bg-black/50 flex justify-center items-center z-[9999] p-4"
        role="dialog"
        aria-modal="true"
        @click.self="handleBackdropClick"
      >
        <div class="bg-white rounded-2xl p-8 w-full relative shadow-2xl max-h-full overflow-y-auto" :style="{ maxWidth }">
          <button
            v-if="showCloseButton"
            type="button"
            class="absolute top-4 right-4 bg-transparent border-2 border-orange-500 text-orange-500 w-8 h-8 rounded-full cursor-pointer flex justify-center items-center transition-transform duration-150 hover:scale-105"
            aria-label="Cerrar modal"
            @click="close"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>

          <header v-if="$slots.header" class="mb-4">
            <slot name="header" />
          </header>

          <main>
            <slot />
          </main>

          <footer v-if="$slots.footer" class="mt-6">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 200ms ease-in-out;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active > div,
.modal-fade-leave-active > div {
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-fade-enter-from > div,
.modal-fade-leave-to > div {
  transform: scale(0.95);
}
</style>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from "vue";

interface Props {
  modelValue?: File[] | File | null;
  multiple?: boolean;
  accept?: string;
  maxFiles?: number;
  maxSizeMb?: number;
  disabled?: boolean;
  title?: string;
  buttonText?: string;
  hint?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  multiple: false,
  accept: "image/png, image/jpeg, image/webp",
  maxFiles: 5,
  maxSizeMb: 5,
  disabled: false,
  title: "Arrastra tus archivos aquí",
  buttonText: "Seleccionar archivo",
  hint: "",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: File[] | File | null): void;
  (e: "change", files: File[]): void;
  (e: "error", message: string): void;
}>();

interface FileEntry {
  id: string;
  file: File;
  previewUrl: string | null;
  isImage: boolean;
}

const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const entries = ref<FileEntry[]>([]);

const canAddMore = computed(() => {
  if (props.disabled) return false;
  if (!props.multiple) return entries.value.length === 0;
  return entries.value.length < props.maxFiles;
});

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function createEntry(file: File): FileEntry {
  const isImg = isImageFile(file);
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
    file,
    previewUrl: isImg ? URL.createObjectURL(file) : null,
    isImage: isImg,
  };
}

function clearEntryUrls() {
  entries.value.forEach((entry) => {
    if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl);
  });
}

function syncFromProps() {
  clearEntryUrls();
  const raw = props.modelValue;
  if (!raw) {
    entries.value = [];
    return;
  }
  const files = Array.isArray(raw) ? raw : [raw];
  entries.value = files.filter(Boolean).map(createEntry);
}

watch(() => props.modelValue, syncFromProps, { immediate: true });

onBeforeUnmount(() => {
  clearEntryUrls();
});

function emitChanges() {
  const files = entries.value.map((e) => e.file);
  emit("change", files);

  if (props.multiple) {
    emit("update:modelValue", files);
  } else {
    emit("update:modelValue", files[0] || null);
  }
}

function validateFile(file: File): boolean {
  const maxBytes = props.maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    emit("error", `"${file.name}" supera el tamaño máximo permitido (${props.maxSizeMb}MB).`);
    return false;
  }

  if (props.accept) {
    const patterns = props.accept.split(",").map((s) => s.trim().toLowerCase());
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    const matches = patterns.some((pattern) => {
      if (pattern.startsWith(".")) return fileName.endsWith(pattern);
      if (pattern.endsWith("/*")) return fileType.startsWith(pattern.replace("/*", ""));
      return fileType === pattern;
    });

    if (!matches) {
      emit("error", `"${file.name}" tiene un formato no permitido. Formatos aceptados: ${props.accept}`);
      return false;
    }
  }

  return true;
}

function processIncomingFiles(fileList: FileList | File[]) {
  if (props.disabled) return;

  const filesArray = Array.from(fileList);
  if (filesArray.length === 0) return;

  const validFiles: File[] = [];
  for (const file of filesArray) {
    if (validateFile(file)) validFiles.push(file);
  }

  if (validFiles.length === 0) return;

  if (!props.multiple) {
    clearEntryUrls();
    entries.value = [createEntry(validFiles[0])];
  } else {
    const available = props.maxFiles - entries.value.length;
    if (available <= 0) {
      emit("error", `Límite alcanzado: máximo ${props.maxFiles} archivos.`);
      return;
    }

    const toAdd = validFiles.slice(0, available);
    if (validFiles.length > available) {
      emit("error", `Solo se añadieron ${available} archivo(s). Límite de ${props.maxFiles} alcanzado.`);
    }

    entries.value.push(...toAdd.map(createEntry));
  }

  emitChanges();
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files) processIncomingFiles(target.files);
  if (fileInputRef.value) fileInputRef.value.value = "";
}

function handleDragOver(e: DragEvent) {
  if (props.disabled) return;
  e.preventDefault();
  isDragging.value = true;
}

function handleDragLeave(e: DragEvent) {
  if (props.disabled) return;
  e.preventDefault();
  isDragging.value = false;
}

function handleDrop(e: DragEvent) {
  if (props.disabled) return;
  e.preventDefault();
  isDragging.value = false;
  if (e.dataTransfer?.files) processIncomingFiles(e.dataTransfer.files);
}

function removeFile(index: number) {
  if (props.disabled) return;
  const removed = entries.value.splice(index, 1);
  if (removed[0]?.previewUrl) URL.revokeObjectURL(removed[0].previewUrl);
  emitChanges();
}

function triggerFileInput() {
  if (props.disabled) return;
  fileInputRef.value?.click();
}
</script>

<template>
  <div
    :class="[
      'flex w-full flex-col gap-3.5',
      disabled ? 'pointer-events-none opacity-60' : ''
    ]"
  >
    <input
      ref="fileInputRef"
      type="file"
      class="hidden"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      @change="handleFileSelect"
    />

    <div
      v-if="canAddMore"
      :class="[
        'group flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors cursor-pointer',
        isDragging
          ? 'border-[#189c94] bg-[#f0fdfa]'
          : 'border-slate-300 bg-slate-50 hover:border-[#189c94] hover:bg-[#f0fdfa]'
      ]"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <i
        :class="[
          'fa-solid fa-cloud-arrow-up mb-2 text-3xl transition-colors',
          isDragging ? 'text-[#189c94]' : 'text-slate-400 group-hover:text-[#189c94]'
        ]"
      ></i>

      <p class="m-0 text-sm font-medium text-slate-700">
        {{ title }}
      </p>

      <button
        type="button"
        class="mt-3.5 inline-flex items-center justify-center rounded-full border-2 border-[#189c94] bg-transparent px-5 py-1 text-xs font-semibold text-[#189c94] transition-all hover:bg-[#189c94] hover:text-white"
        :disabled="disabled"
        @click.stop="triggerFileInput"
      >
        {{ buttonText }}
      </button>

      <p v-if="hint" class="mt-2 text-xs text-slate-500">
        {{ hint }}
      </p>
    </div>

    <div
      v-if="entries.length > 0"
      class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3.5"
    >
      <div
        v-for="(entry, idx) in entries"
        :key="entry.id"
        class="relative flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xs"
      >
        <div class="flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-slate-100">
          <img
            v-if="entry.isImage"
            :src="entry.previewUrl!"
            :alt="entry.file.name"
            class="h-full w-full object-cover"
          />
          <i
            v-else
            class="fa-regular fa-file-lines text-3xl text-slate-400"
          ></i>
        </div>

        <div class="flex flex-col min-w-0">
          <span
            class="truncate text-xs font-semibold text-[#083c5a]"
            :title="entry.file.name"
          >
            {{ entry.file.name }}
          </span>
          <span class="text-[11px] text-slate-400">
            {{ formatFileSize(entry.file.size) }}
          </span>
        </div>

        <button
          type="button"
          class="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500/90 text-white text-xs transition-transform hover:scale-110 hover:bg-red-600"
          title="Eliminar archivo"
          :disabled="disabled"
          @click.stop="removeFile(idx)"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  </div>
</template>

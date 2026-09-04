<script setup lang="ts">
import { ref, nextTick, onBeforeUnmount } from "vue";
import BaseModal from "../common/BaseModal.vue";
import ConfirmModal from "../common/ConfirmModal.vue";
import BaseFileDropZone from "../common/BaseFileDropZone.vue";
import ProfileAvatar from "./ProfileAvatar.vue";
import ProviderLogo from "../organization/ProviderLogo.vue";

interface Props {
  blobId: string | null;
  alt: string;
  isProvider?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isProvider: false,
});

const emit = defineEmits<{
  (e: "save", file: File): void;
  (e: "delete"): void;
}>();

// --- UI State ---
const isDropdownOpen = ref(false);
const showViewModal = ref(false);
const showDeleteModal = ref(false);
const showEditorModal = ref(false);

type EditorStep = "choice" | "upload" | "camera" | "adjust";
const editorStep = ref<EditorStep>("choice");

// --- Camera/Adjust State ---
const videoElement = ref<HTMLVideoElement | null>(null);
const canvasElement = ref<HTMLCanvasElement | null>(null);
let mediaStream: MediaStream | null = null;
let currentAdjustImage: HTMLImageElement | null = null;
const cameraActive = ref(false);
const zoomScale = ref(1);
const panOffset = ref({ x: 0, y: 0 });
let isDragging = false;
let dragStartPos = { x: 0, y: 0 };
let panStartPos = { x: 0, y: 0 };
const isSavingPhoto = ref(false);

// --- Dropdown & Modal Controls ---
const toggleDropdown = () => { isDropdownOpen.value = !isDropdownOpen.value; };
const closeDropdown = () => { isDropdownOpen.value = false; };

const openEditor = (step: EditorStep = "choice") => {
  closeDropdown();
  editorStep.value = step;
  showEditorModal.value = true;
  if (step === "camera") nextTick(() => startCameraStream());
};

const closeEditor = () => {
  showEditorModal.value = false;
  stopCameraStream();
  currentAdjustImage = null;
  editorStep.value = "choice";
};

// --- Camera Logic ---
const startCameraStream = async () => {
  stopCameraStream();
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    if (videoElement.value) {
      videoElement.value.srcObject = mediaStream;
      await videoElement.value.play();
      cameraActive.value = true;
    }
  } catch (err) {
    cameraActive.value = false;
  }
};

const stopCameraStream = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
  cameraActive.value = false;
};

const captureFromCamera = () => {
  if (!videoElement.value) return;
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = videoElement.value.videoWidth || 640;
  tempCanvas.height = videoElement.value.videoHeight || 480;
  const ctx = tempCanvas.getContext("2d");
  ctx?.drawImage(videoElement.value, 0, 0);
  prepareImageForAdjust(tempCanvas.toDataURL("image/jpeg"));
};

// --- File Upload Logic ---
const handleFileFromDropzone = (file: File | File[] | null) => {
  if (file instanceof File) {
    processUploadedFile(file);
  }
};

const processUploadedFile = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target?.result) prepareImageForAdjust(e.target.result as string);
  };
  reader.readAsDataURL(file);
};

// --- Adjust/Crop Logic ---
const prepareImageForAdjust = (src: string) => {
  stopCameraStream();
  const img = new Image();
  img.onload = () => {
    currentAdjustImage = img;
    editorStep.value = "adjust";
    zoomScale.value = 1;
    panOffset.value = { x: 0, y: 0 };
    nextTick(() => renderCanvas());
  };
  img.src = src;
};

const renderCanvas = () => {
  if (!canvasElement.value || !currentAdjustImage) return;
  const canvas = canvasElement.value;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const baseScale = Math.max(canvas.width / currentAdjustImage.width, canvas.height / currentAdjustImage.height) * zoomScale.value;
  const dw = currentAdjustImage.width * baseScale;
  const dh = currentAdjustImage.height * baseScale;
  const dx = (canvas.width - dw) / 2 + panOffset.value.x;
  const dy = (canvas.height - dh) / 2 + panOffset.value.y;

  ctx.drawImage(currentAdjustImage, dx, dy, dw, dh);
};

const handleZoom = (delta: number) => {
  zoomScale.value = Math.max(0.5, Math.min(3, zoomScale.value + delta));
  renderCanvas();
};

const startCanvasDrag = (clientX: number, clientY: number) => {
  isDragging = true;
  dragStartPos = { x: clientX, y: clientY };
  panStartPos = { ...panOffset.value };
};

const moveCanvasDrag = (clientX: number, clientY: number) => {
  if (!isDragging) return;
  panOffset.value = { x: panStartPos.x + (clientX - dragStartPos.x), y: panStartPos.y + (clientY - dragStartPos.y) };
  renderCanvas();
};

const endCanvasDrag = () => { isDragging = false; };

// --- Save & Emit (The Callback) ---
const saveCroppedAvatar = () => {
  if (!canvasElement.value) return;
  isSavingPhoto.value = true;

  canvasElement.value.toBlob(async (blob) => {
    if (!blob) { isSavingPhoto.value = false; return; }
    try {
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      emit("save", file);
      closeEditor();
    } finally {
      isSavingPhoto.value = false;
    }
  }, "image/jpeg", 0.9);
};

// --- Delete Logic ---
const handleDeleteConfirm = () => {
  emit("delete");
  showDeleteModal.value = false;
};

onBeforeUnmount(() => { stopCameraStream(); });

// Expose method so parent can trigger the editor if needed
defineExpose({
  openEditor
});
</script>

<template>
  <div class="relative w-[150px] h-[150px] shrink-0">
    <div class="relative w-full h-full">
      <!-- Avatar Display -->
      <div class="w-full h-full rounded-full overflow-hidden text-[4.5rem]">
        <ProfileAvatar v-if="!isProvider" :blob-id="blobId" :alt="alt" />
        <ProviderLogo v-else :blob-id="blobId" :alt="alt" />
      </div>

      <!-- Edit Button -->
      <button
        type="button"
        class="absolute bottom-1 right-2 bg-(--primary-blue) text-white border-[3px] border-white w-[38px] h-[38px] rounded-full flex justify-center items-center cursor-pointer text-base shadow-[0_2px_8px_rgba(0,0,0,0.15)] z-[2] hover:opacity-90 transition-opacity"
        aria-label="Cambiar foto"
        @click="toggleDropdown"
      >
        <i class="fa-solid fa-camera"></i>
      </button>

      <!-- Dropdown Menu -->
      <!-- Responsive: Opens to the right on desktop, centers below on mobile -->
      <div
        v-if="isDropdownOpen"
        class="absolute top-0 left-[105%] max-md:top-[105%] max-md:left-1/2 max-md:-translate-x-1/2 bg-white border border-(--border-gray) rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.15)] py-1.5 min-w-[160px] z-[200]"
      >
        <button class="flex items-center gap-3 w-full px-4 py-2.5 border-none bg-none text-sm text-(--text-dark) cursor-pointer text-left hover:bg-(--bg-gray) transition-colors" @click="openEditor('choice')">
          <i class="fa-solid fa-rotate"></i> Cambiar Foto
        </button>
        <button v-if="blobId" class="flex items-center gap-3 w-full px-4 py-2.5 border-none bg-none text-sm text-(--text-dark) cursor-pointer text-left hover:bg-(--bg-gray) transition-colors" @click="() => { closeDropdown(); showViewModal = true; }">
          <i class="fa-regular fa-image"></i> Ver foto
        </button>
        <div v-if="blobId" class="h-px bg-(--border-gray) my-1"></div>
        <button v-if="blobId" class="flex items-center gap-3 w-full px-4 py-2.5 border-none bg-none text-sm text-red-500 cursor-pointer text-left hover:bg-red-50 transition-colors" @click="() => { closeDropdown(); showDeleteModal = true; }">
          <i class="fa-regular fa-trash-can"></i> Eliminar Foto
        </button>
      </div>
    </div>

    <!-- View Photo Modal -->
    <BaseModal v-model="showViewModal" max-width="400px" @close="showViewModal = false">
      <div class="flex justify-center items-center p-4 w-60 h-60 mx-auto text-[6rem]">
        <ProfileAvatar v-if="!isProvider" :blob-id="blobId" :alt="alt" />
        <ProviderLogo v-else :blob-id="blobId" :alt="alt" />
      </div>
    </BaseModal>

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      title="¿Deseas eliminar tu foto de perfil?"
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      icon="fa-regular fa-trash-can"
      icon-variant="orange"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteModal = false"
    />

    <!-- Multi-step Editor Modal -->
    <BaseModal v-model="showEditorModal" max-width="480px" :show-close-button="false" @close="closeEditor">
      <template #header>
        <div class="flex justify-between items-center mb-6">
          <button class="bg-none border-none text-xl text-(--primary-blue) cursor-pointer" @click="closeEditor"><i class="fa-solid fa-arrow-left"></i></button>
          <h3 class="text-xl text-(--primary-blue) font-bold">
            {{ editorStep === "camera" ? "Tomar Foto" : editorStep === "adjust" ? "Ajustar Foto" : "Cambiar Foto" }}
          </h3>
          <button class="bg-(--primary-orange) text-white border-none w-[30px] h-[30px] rounded-full flex justify-center items-center cursor-pointer hover:opacity-90 transition-opacity" @click="closeEditor"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </template>

      <!-- Step 1: Choice -->
      <div v-if="editorStep === 'choice'" class="text-center">
        <div class="w-20 h-20 rounded-full bg-slate-500 text-white text-[2.6rem] flex justify-center items-center mx-auto mb-3">
          <i class="fa-solid fa-user"></i>
        </div>
        <p class="text-slate-500 text-sm mb-6">Elige cómo cambiar tu foto</p>

        <button class="flex items-center w-full p-4 border-[1.5px] border-(--light-teal) rounded-xl bg-white mb-3.5 cursor-pointer text-left hover:bg-slate-50 transition-colors" @click="editorStep = 'upload'">
          <div class="w-11 h-11 rounded-full bg-teal-50 text-(--light-teal) flex justify-center items-center text-lg mr-4 shrink-0">
            <i class="fa-regular fa-image"></i>
          </div>
          <div class="text-left flex-1">
            <h4 class="text-(--primary-blue) text-[0.95rem] mb-0.5 font-semibold">Seleccionar una imagen</h4>
            <p class="text-xs text-slate-500">Desde tu equipo</p>
          </div>
          <i class="fa-solid fa-chevron-right text-(--light-teal)"></i>
        </button>

        <button class="flex items-center w-full p-4 border-[1.5px] border-(--border-gray) rounded-xl bg-white mb-3.5 cursor-pointer text-left hover:bg-slate-50 transition-colors" @click="() => { editorStep = 'camera'; startCameraStream(); }">
          <div class="w-11 h-11 rounded-full bg-(--bg-gray) text-slate-500 flex justify-center items-center text-lg mr-4 shrink-0">
            <i class="fa-solid fa-camera"></i>
          </div>
          <div class="text-left flex-1">
            <h4 class="text-(--primary-blue) text-[0.95rem] mb-0.5 font-semibold">Tomar una foto</h4>
            <p class="text-xs text-slate-500">Usa tu cámara</p>
          </div>
          <i class="fa-solid fa-chevron-right text-slate-500"></i>
        </button>
      </div>

      <!-- Step 2: Upload -->


          <BaseFileDropZone v-if="editorStep === 'upload'"
            :multiple="false"
            accept="image/png, image/jpeg"
            :max-size-mb="3"
            title="Arrastra una imagen aquí"
            button-text="Seleccionar archivo"
            hint="Formatos: JPG, PNG. Tamaño máx: 3MB."
            @update:model-value="handleFileFromDropzone"
            @error="(msg) => console.log(msg)"
          />


      <!-- Step 3: Camera -->
      <div v-if="editorStep === 'camera'">
        <div class="w-full h-[280px] bg-black rounded-xl overflow-hidden relative flex justify-center items-center mb-6">
          <video ref="videoElement" autoplay playsinline class="w-full h-full object-cover"></video>
          <div v-if="!cameraActive" class="absolute text-white text-center">
            <i class="fa-solid fa-camera text-3xl mb-2 block"></i>
            <p>Se necesita acceso a la cámara.</p>
          </div>
        </div>
        <div class="flex items-center justify-between">
          <button class="bg-white border border-(--border-gray) text-(--primary-blue) px-6 py-2.5 rounded-lg font-semibold cursor-pointer hover:bg-(--bg-gray) transition-colors" @click="() => { stopCameraStream(); editorStep = 'choice'; }">Cancelar</button>
          <button class="w-14 h-14 rounded-full bg-(--light-teal) border-[3px] border-white shadow-[0_0_0_2px_var(--border-gray)] cursor-pointer disabled:opacity-50 transition-opacity hover:opacity-90" :disabled="!cameraActive" @click="captureFromCamera"></button>
          <button class="w-11 h-11 border border-(--border-gray) bg-white rounded-lg flex justify-center items-center cursor-pointer hover:bg-(--bg-gray) transition-colors" @click="() => { stopCameraStream(); editorStep = 'upload'; }">
            <i class="fa-solid fa-image"></i>
          </button>
        </div>
      </div>

      <!-- Step 4: Adjust/Crop -->
      <div v-if="editorStep === 'adjust'">
        <p class="text-center text-slate-500 text-sm mb-3">Arrastra la imagen para centrarla.</p>
        <div class="w-full max-w-[300px] aspect-square mx-auto mb-4 relative overflow-hidden rounded-lg bg-slate-100">
          <canvas
            ref="canvasElement"
            class="w-full h-full block cursor-grab active:cursor-grabbing"
            @mousedown="(e) => startCanvasDrag(e.clientX, e.clientY)"
            @mousemove="(e) => moveCanvasDrag(e.clientX, e.clientY)"
            @mouseup="endCanvasDrag"
            @mouseleave="endCanvasDrag"
            @touchstart="(e) => startCanvasDrag(e.touches[0].clientX, e.touches[0].clientY)"
            @touchmove="(e) => moveCanvasDrag(e.touches[0].clientX, e.touches[0].clientY)"
            @touchend="endCanvasDrag"
          ></canvas>
          <div class="absolute inset-0 pointer-events-none">
            <div class="w-full h-full rounded-full border-2 border-black/80 shadow-[0_0_0_9999px_rgba(255,255,255,0.4)]"></div>
          </div>
        </div>
        <div class="flex justify-center gap-6 mb-6">
          <button type="button" class="w-11 h-11 border border-(--border-gray) bg-white rounded-full flex justify-center items-center cursor-pointer hover:bg-(--bg-gray) transition-colors" @click="handleZoom(-0.1)">
            <i class="fa-solid fa-minus"></i>
          </button>
          <button type="button" class="w-11 h-11 border border-(--border-gray) bg-white rounded-full flex justify-center items-center cursor-pointer hover:bg-(--bg-gray) transition-colors" @click="handleZoom(0.1)">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
        <div class="flex justify-between">
          <button type="button" class="bg-white border border-(--border-gray) text-(--primary-blue) px-6 py-2.5 rounded-lg font-semibold cursor-pointer hover:bg-(--bg-gray) transition-colors" @click="closeEditor">Cancelar</button>
          <button type="button" class="bg-(--light-teal) text-white border-none px-6 py-2.5 rounded-lg font-semibold cursor-pointer flex items-center gap-2 disabled:opacity-50 transition-opacity hover:opacity-90" :disabled="isSavingPhoto" @click="saveCroppedAvatar">
            <i :class="isSavingPhoto ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'"></i>
            {{ isSavingPhoto ? "Guardando..." : "Usar foto" }}
          </button>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

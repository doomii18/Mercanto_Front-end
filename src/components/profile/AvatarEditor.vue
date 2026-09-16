<script setup lang="ts">
import { ref, computed, watch, nextTick, useTemplateRef } from "vue";
import {
  useUserMedia,
  useDevicesList,
  onClickOutside,
} from "@vueuse/core";
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
const dropdownMenuRef = useTemplateRef<HTMLElement>("dropdownMenuRef");
const dropdownButtonRef = useTemplateRef<HTMLButtonElement>("dropdownButtonRef");

const showViewModal = ref(false);
const showDeleteModal = ref(false);
const showEditorModal = ref(false);

type EditorStep = "choice" | "upload" | "camera" | "adjust";
const editorStep = ref<EditorStep>("choice");
const previousStep = ref<"choice" | "upload" | "camera">("choice");

// --- Contextual labels (Photo for buyer, Logo for provider) ---
const entityLabelCapitalized = computed(() =>
  props.isProvider ? "Logo de Negocio" : "Foto de Perfil"
);
const changeActionLabel = computed(() =>
  props.isProvider ? "Cambiar Logo" : "Cambiar Foto"
);
const viewActionLabel = computed(() =>
  props.isProvider ? "Ver logo completo" : "Ver foto completa"
);
const deleteActionLabel = computed(() =>
  props.isProvider ? "Eliminar Logo" : "Eliminar Foto"
);
const deleteConfirmTitle = computed(() =>
  props.isProvider
    ? "¿Deseas eliminar el logo de tu negocio?"
    : "¿Deseas eliminar tu foto de perfil?"
);
const deleteConfirmDescription = computed(() =>
  props.isProvider
    ? "El logo de tu negocio volverá a mostrar las iniciales de tu empresa. Podrás subir uno nuevo cuando lo desees."
    : "Tu avatar volverá a mostrar las iniciales de tu cuenta. Podrás subir una nueva foto cuando lo desees."
);
const uploadDropzoneTitle = computed(() =>
  props.isProvider
    ? "Arrastra el logo de tu negocio aquí"
    : "Arrastra tu foto de perfil aquí"
);
const modalTitle = computed(() => {
  if (editorStep.value === "camera") return "Tomar Foto";
  if (editorStep.value === "upload") return props.isProvider ? "Subir Logo" : "Subir Foto";
  if (editorStep.value === "adjust") return "Ajustar y Encuadrar";
  return changeActionLabel.value;
});

// --- VueUse Devices & UserMedia ---
const selectedCameraId = ref<string>("");

const {
  videoInputs: cameras,
  ensurePermissions: requestCameraPermissions,
} = useDevicesList({
  requestPermissions: false,
  constraints: { video: true },
});

const cameraConstraints = computed<MediaStreamConstraints>(() => {
  if (selectedCameraId.value) {
    return {
      video: {
        deviceId: { exact: selectedCameraId.value },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };
  }
  return {
    video: {
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  };
});

const {
  stream: mediaStream,
  start: startCameraStream,
  stop: stopCameraStream,
  restart: restartCameraStream,
  enabled: isCameraEnabled,
} = useUserMedia({
  constraints: cameraConstraints,
  autoSwitch: true,
});

// Auto-select first camera once available
watch(
  cameras,
  (availableCameras) => {
    if (availableCameras.length > 0 && !selectedCameraId.value) {
      selectedCameraId.value = availableCameras[0].deviceId;
    }
  },
  { immediate: true }
);

// Switch camera when user selects another device from dropdown
const onCameraDeviceChange = async () => {
  if (isCameraEnabled.value) {
    await restartCameraStream();
  }
};

// Toggle camera facing mode (e.g., front/back on mobile if multiple cameras exist)
const hasMultipleCameras = computed(() => cameras.value.length > 1);
const cycleCamera = async () => {
  if (cameras.value.length <= 1) return;
  const currentIndex = cameras.value.findIndex(
    (c) => c.deviceId === selectedCameraId.value
  );
  const nextIndex = (currentIndex + 1) % cameras.value.length;
  selectedCameraId.value = cameras.value[nextIndex].deviceId;
  await restartCameraStream();
};

// Video preview ref and stream binding
const videoElement = useTemplateRef<HTMLVideoElement>("videoElement");
const cameraErrorMessage = ref<string | null>(null);
const isCameraLoading = ref(false);

watch(
  [mediaStream, videoElement],
  ([stream, videoEl]) => {
    if (videoEl) {
      videoEl.srcObject = stream ?? null;
    }
  },
  { immediate: true }
);

// --- VueUse Click Outside to close dropdown ---
onClickOutside(
  dropdownMenuRef,
  () => {
    if (isDropdownOpen.value) {
      isDropdownOpen.value = false;
    }
  },
  { ignore: [dropdownButtonRef] }
);

// --- Adjust/Crop State ---
const canvasElement = useTemplateRef<HTMLCanvasElement>("canvasElement");
let currentAdjustImage: HTMLImageElement | null = null;
const zoomScale = ref(1);
const panOffset = ref({ x: 0, y: 0 });
let isDragging = false;
let dragStartPos = { x: 0, y: 0 };
let panStartPos = { x: 0, y: 0 };
const isSavingPhoto = ref(false);

// --- Dropdown & Modal Controls ---
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};
const closeDropdown = () => {
  isDropdownOpen.value = false;
};

const goToStep = async (step: EditorStep) => {
  if (editorStep.value !== "adjust") {
    previousStep.value = editorStep.value;
  }
  editorStep.value = step;

  if (step === "camera") {
    await initCamera();
  } else {
    stopCamera();
  }
};

const handleBackNav = () => {
  if (editorStep.value === "adjust") {
    // If user was in adjust, take them back to the source step (upload or camera)
    goToStep(previousStep.value);
  } else {
    goToStep("choice");
  }
};

const openEditor = async (step: EditorStep = "choice") => {
  closeDropdown();
  previousStep.value = "choice";
  showEditorModal.value = true;
  cameraErrorMessage.value = null;
  await goToStep(step);
};

const closeEditor = () => {
  showEditorModal.value = false;
  stopCamera();
  currentAdjustImage = null;
  editorStep.value = "choice";
  previousStep.value = "choice";
  cameraErrorMessage.value = null;
};

// --- Camera Logic ---
const initCamera = async () => {
  isCameraLoading.value = true;
  cameraErrorMessage.value = null;
  try {
    await requestCameraPermissions();
    await startCameraStream();
  } catch (err: any) {
    cameraErrorMessage.value =
      err?.message ||
      "No se pudo acceder a la cámara. Verifica los permisos en tu navegador.";
  } finally {
    isCameraLoading.value = false;
  }
};

const stopCamera = () => {
  stopCameraStream();
  if (videoElement.value) {
    videoElement.value.srcObject = null;
  }
};

const captureFromCamera = () => {
  if (!videoElement.value) return;
  const vid = videoElement.value;
  const width = vid.videoWidth || 640;
  const height = vid.videoHeight || 480;

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const ctx = tempCanvas.getContext("2d");
  if (!ctx) return;

  // Mirror effect matches live preview
  ctx.translate(width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(vid, 0, 0, width, height);

  previousStep.value = "camera";
  prepareImageForAdjust(tempCanvas.toDataURL("image/jpeg", 0.95));
};

// --- File Upload Logic (Always routes through crop/adjust) ---
const handleFileFromDropzone = (file: File | File[] | null) => {
  if (file instanceof File) {
    previousStep.value = "upload";
    processUploadedFile(file);
  }
};

const processUploadedFile = (file: File) => {
  if (!file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target?.result) {
      prepareImageForAdjust(e.target.result as string);
    }
  };
  reader.readAsDataURL(file);
};

// --- Adjust/Crop Logic ---
const prepareImageForAdjust = (src: string) => {
  stopCamera();
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

  // Render using client dimensions with high DPR
  const dpr = window.devicePixelRatio || 1;
  const displayWidth = canvas.clientWidth || 300;
  const displayHeight = canvas.clientHeight || 300;

  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;

  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, displayWidth, displayHeight);

  const baseScale =
    Math.max(
      displayWidth / currentAdjustImage.width,
      displayHeight / currentAdjustImage.height
    ) * zoomScale.value;

  const dw = currentAdjustImage.width * baseScale;
  const dh = currentAdjustImage.height * baseScale;
  const dx = (displayWidth - dw) / 2 + panOffset.value.x;
  const dy = (displayHeight - dh) / 2 + panOffset.value.y;

  ctx.drawImage(currentAdjustImage, dx, dy, dw, dh);
};

const handleZoom = (delta: number) => {
  zoomScale.value = Math.max(0.5, Math.min(3.5, Number((zoomScale.value + delta).toFixed(2))));
  renderCanvas();
};

const onZoomSliderInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  zoomScale.value = parseFloat(target.value);
  renderCanvas();
};

const resetAdjust = () => {
  zoomScale.value = 1;
  panOffset.value = { x: 0, y: 0 };
  renderCanvas();
};

// --- Drag & Pan Handlers ---
const startCanvasDrag = (clientX: number, clientY: number) => {
  isDragging = true;
  dragStartPos = { x: clientX, y: clientY };
  panStartPos = { ...panOffset.value };
};

const moveCanvasDrag = (clientX: number, clientY: number) => {
  if (!isDragging) return;
  panOffset.value = {
    x: panStartPos.x + (clientX - dragStartPos.x),
    y: panStartPos.y + (clientY - dragStartPos.y),
  };
  renderCanvas();
};

const endCanvasDrag = () => {
  isDragging = false;
};

// Touch pinch to zoom & pan support
let initialPinchDistance = 0;
let initialPinchScale = 1;

const onTouchStart = (e: TouchEvent) => {
  if (e.touches.length === 1) {
    startCanvasDrag(e.touches[0].clientX, e.touches[0].clientY);
  } else if (e.touches.length === 2) {
    isDragging = false;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    initialPinchDistance = Math.hypot(dx, dy);
    initialPinchScale = zoomScale.value;
  }
};

const onTouchMove = (e: TouchEvent) => {
  if (e.touches.length === 1) {
    moveCanvasDrag(e.touches[0].clientX, e.touches[0].clientY);
  } else if (e.touches.length === 2 && initialPinchDistance > 0) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const distance = Math.hypot(dx, dy);
    const factor = distance / initialPinchDistance;
    zoomScale.value = Math.max(0.5, Math.min(3.5, initialPinchScale * factor));
    renderCanvas();
  }
};

const onTouchEnd = () => {
  endCanvasDrag();
  initialPinchDistance = 0;
};

// Wheel zoom over canvas
const onCanvasWheel = (e: WheelEvent) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.1 : -0.1;
  handleZoom(delta);
};

// --- Save & Emit ---
const saveCroppedAvatar = () => {
  if (!canvasElement.value || !currentAdjustImage) return;
  isSavingPhoto.value = true;

  // Export 512x512 high-resolution avatar for best sharpness
  const exportCanvas = document.createElement("canvas");
  const exportSize = 512;
  exportCanvas.width = exportSize;
  exportCanvas.height = exportSize;
  const exportCtx = exportCanvas.getContext("2d");

  if (!exportCtx) {
    isSavingPhoto.value = false;
    return;
  }

  const displayWidth = canvasElement.value.clientWidth || 300;
  const displayHeight = canvasElement.value.clientHeight || 300;
  const factor = exportSize / displayWidth;

  const baseScale =
    Math.max(
      displayWidth / currentAdjustImage.width,
      displayHeight / currentAdjustImage.height
    ) * zoomScale.value;

  const dw = currentAdjustImage.width * baseScale * factor;
  const dh = currentAdjustImage.height * baseScale * factor;
  const dx = ((displayWidth - dw / factor) / 2 + panOffset.value.x) * factor;
  const dy = ((displayHeight - dh / factor) / 2 + panOffset.value.y) * factor;

  exportCtx.drawImage(currentAdjustImage, dx, dy, dw, dh);

  exportCanvas.toBlob(
    async (blob) => {
      if (!blob) {
        isSavingPhoto.value = false;
        return;
      }
      try {
        const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
        emit("save", file);
        closeEditor();
      } finally {
        isSavingPhoto.value = false;
      }
    },
    "image/jpeg",
    0.92
  );
};

// --- Delete Logic ---
const handleDeleteConfirm = () => {
  emit("delete");
  showDeleteModal.value = false;
};

defineExpose({
  openEditor,
});
</script>

<template>
  <div class="relative w-[150px] h-[150px] shrink-0 select-none">
    <div class="relative w-full h-full group">
      <!-- Avatar Display with subtle ring & hover effect -->
      <div
        class="w-full h-full rounded-full overflow-hidden text-[4.5rem] ring-4 ring-white shadow-md transition-transform duration-200 group-hover:scale-[1.01]"
      >
        <ProfileAvatar v-if="!isProvider" :blob-id="blobId" :alt="alt" />
        <ProviderLogo v-else :blob-id="blobId" :alt="alt" />
      </div>

      <!-- Edit Button Badge -->
      <button
        ref="dropdownButtonRef"
        type="button"
        class="absolute bottom-1 right-1 bg-(--primary-blue) text-white border-[3px] border-white w-10 h-10 rounded-full flex justify-center items-center cursor-pointer text-sm shadow-md z-[2] hover:bg-(--color-blue-600) hover:scale-105 active:scale-95 transition-all focus:outline-hidden focus:ring-2 focus:ring-(--light-teal)"
        :aria-expanded="isDropdownOpen"
        aria-haspopup="menu"
        aria-label="Opciones de foto de perfil"
        @click="toggleDropdown"
      >
        <i class="fa-solid fa-camera"></i>
      </button>

      <!-- Dropdown Menu -->
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <div
          v-if="isDropdownOpen"
          ref="dropdownMenuRef"
          role="menu"
          class="absolute top-0 left-[105%] max-md:top-[105%] max-md:left-1/2 max-md:-translate-x-1/2 bg-white border border-(--border-gray) rounded-2xl shadow-xl py-2 min-w-[200px] z-[200] divide-y divide-slate-100"
        >
          <div class="py-1">
            <button
              role="menuitem"
              type="button"
              class="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-(--text-dark) hover:bg-slate-50 transition-colors font-medium cursor-pointer text-left"
              @click="openEditor('choice')"
            >
              <span class="w-8 h-8 rounded-full bg-teal-50 text-(--light-teal) flex items-center justify-center text-xs">
                <i class="fa-solid fa-camera-rotate"></i>
              </span>
              <span>{{ changeActionLabel }}</span>
            </button>

            <button
              v-if="blobId"
              role="menuitem"
              type="button"
              class="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-(--text-dark) hover:bg-slate-50 transition-colors font-medium cursor-pointer text-left"
              @click="() => { closeDropdown(); showViewModal = true; }"
            >
              <span class="w-8 h-8 rounded-full bg-blue-50 text-(--primary-blue) flex items-center justify-center text-xs">
                <i class="fa-regular fa-image"></i>
              </span>
              <span>{{ viewActionLabel }}</span>
            </button>
          </div>

          <div v-if="blobId" class="py-1">
            <button
              role="menuitem"
              type="button"
              class="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium cursor-pointer text-left"
              @click="() => { closeDropdown(); showDeleteModal = true; }"
            >
              <span class="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-xs">
                <i class="fa-regular fa-trash-can"></i>
              </span>
              <span>{{ deleteActionLabel }}</span>
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- View Photo Modal -->
    <BaseModal v-model="showViewModal" class="max-w-md" @close="showViewModal = false">
      <template #header>
        <h3 class="text-lg font-bold text-(--primary-blue) text-center">
          {{ entityLabelCapitalized }}
        </h3>
      </template>
      <div class="flex justify-center items-center p-2">
        <div class="w-64 h-64 rounded-full overflow-hidden ring-4 ring-(--border-gray) shadow-inner flex items-center justify-center bg-slate-100 text-[6rem]">
          <ProfileAvatar v-if="!isProvider" :blob-id="blobId" :alt="alt" />
          <ProviderLogo v-else :blob-id="blobId" :alt="alt" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="px-5 py-2 rounded-xl text-sm font-semibold border border-(--border-gray) bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            @click="showViewModal = false"
          >
            Cerrar
          </button>
          <button
            type="button"
            class="px-5 py-2 rounded-xl text-sm font-semibold bg-(--primary-blue) text-white hover:bg-(--color-blue-600) transition-colors cursor-pointer flex items-center gap-2"
            @click="() => { showViewModal = false; openEditor('choice'); }"
          >
            <i class="fa-solid fa-pencil"></i> Cambiar
          </button>
        </div>
      </template>
    </BaseModal>

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      :title="deleteConfirmTitle"
      :description="deleteConfirmDescription"
      :confirm-text="deleteActionLabel"
      cancel-text="Cancelar"
      icon="fa-regular fa-trash-can"
      icon-variant="orange"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteModal = false"
    />

    <!-- Multi-step Editor Modal -->
    <BaseModal
      v-model="showEditorModal"
      class="max-w-lg"
      :show-close-button="false"
      @close="closeEditor"
    >
      <template #header>
        <div class="flex justify-between items-center pb-3 border-b border-slate-100">
          <button
            v-if="editorStep !== 'choice'"
            type="button"
            class="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-(--primary-blue) transition-colors cursor-pointer"
            title="Volver"
            @click="handleBackNav"
          >
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div v-else class="w-8"></div>

          <h3 class="text-lg text-(--primary-blue) font-bold">
            {{ modalTitle }}
          </h3>

          <button
            type="button"
            class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
            @click="closeEditor"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </template>

      <!-- Step 1: Choice -->
      <div v-if="editorStep === 'choice'" class="py-2 text-center">
        <div class="w-20 h-20 rounded-full bg-slate-100 text-(--primary-blue) text-3xl flex justify-center items-center mx-auto mb-3 shadow-inner">
          <i class="fa-solid fa-user-circle"></i>
        </div>
        <p class="text-slate-600 text-sm mb-6">
          Personaliza tu perfil eligiendo una de las siguientes opciones
        </p>

        <div class="space-y-3">
          <button
            type="button"
            class="group flex items-center w-full p-4 border border-slate-200 rounded-2xl bg-white hover:border-(--light-teal) hover:bg-teal-50/40 transition-all cursor-pointer text-left shadow-xs hover:shadow-md"
            @click="goToStep('upload')"
          >
            <div class="w-12 h-12 rounded-xl bg-teal-50 text-(--light-teal) flex justify-center items-center text-xl mr-4 shrink-0 transition-transform group-hover:scale-105">
              <i class="fa-regular fa-image"></i>
            </div>
            <div class="flex-1">
              <h4 class="text-(--primary-blue) text-sm font-semibold mb-0.5">
                Subir desde tu dispositivo
              </h4>
              <p class="text-xs text-slate-500">
                Formatos JPG, PNG o WebP hasta 3MB
              </p>
            </div>
            <i class="fa-solid fa-chevron-right text-slate-300 group-hover:text-(--light-teal) transition-colors"></i>
          </button>

          <button
            type="button"
            class="group flex items-center w-full p-4 border border-slate-200 rounded-2xl bg-white hover:border-(--primary-blue) hover:bg-blue-50/40 transition-all cursor-pointer text-left shadow-xs hover:shadow-md"
            @click="goToStep('camera')"
          >
            <div class="w-12 h-12 rounded-xl bg-blue-50 text-(--primary-blue) flex justify-center items-center text-xl mr-4 shrink-0 transition-transform group-hover:scale-105">
              <i class="fa-solid fa-camera"></i>
            </div>
            <div class="flex-1">
              <h4 class="text-(--primary-blue) text-sm font-semibold mb-0.5">
                Tomar foto con la cámara
              </h4>
              <p class="text-xs text-slate-500">
                Usa la cámara web o del teléfono
              </p>
            </div>
            <i class="fa-solid fa-chevron-right text-slate-300 group-hover:text-(--primary-blue) transition-colors"></i>
          </button>
        </div>
      </div>

      <!-- Step 2: Upload DropZone (Files always navigate to Adjust/Crop) -->
      <div v-if="editorStep === 'upload'" class="py-2">
        <BaseFileDropZone
          :multiple="false"
          accept="image/png, image/jpeg, image/webp"
          :max-size-mb="3"
          :title="uploadDropzoneTitle"
          button-text="Explorar archivos"
          hint="Formatos aceptados: JPG, PNG, WEBP. Tamaño máx: 3MB."
          @update:model-value="handleFileFromDropzone"
        />
        <div class="mt-4 flex justify-between items-center text-xs text-slate-500">
          <span>¿Prefieres usar la cámara?</span>
          <button
            type="button"
            class="text-(--light-teal) font-semibold hover:underline cursor-pointer flex items-center gap-1"
            @click="goToStep('camera')"
          >
            <i class="fa-solid fa-camera"></i> Activar cámara
          </button>
        </div>
      </div>

      <!-- Step 3: Camera Live Stream (Capturing always navigates to Adjust/Crop) -->
      <div v-if="editorStep === 'camera'" class="py-1">
        <div class="w-full h-[320px] bg-slate-900 rounded-2xl overflow-hidden relative flex justify-center items-center mb-4 shadow-inner">
          <!-- Video with horizontal mirror effect -->
          <video
            ref="videoElement"
            autoplay
            playsinline
            muted
            class="w-full h-full object-cover scale-x-[-1]"
          ></video>

          <!-- Circular Overlay Guide for framing the face -->
          <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div class="w-56 h-56 rounded-full border-2 border-dashed border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]"></div>
          </div>

          <!-- Loading state -->
          <div v-if="isCameraLoading" class="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center text-white gap-2">
            <i class="fa-solid fa-circle-notch fa-spin text-3xl text-(--light-teal)"></i>
            <span class="text-sm">Iniciando cámara...</span>
          </div>

          <!-- Error or Permission Notice -->
          <div
            v-if="cameraErrorMessage && !isCameraLoading"
            class="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-center p-6 text-white gap-3"
          >
            <div class="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xl">
              <i class="fa-solid fa-video-slash"></i>
            </div>
            <p class="text-sm text-slate-200">{{ cameraErrorMessage }}</p>
            <button
              type="button"
              class="mt-2 px-4 py-2 bg-(--light-teal) text-white rounded-xl text-xs font-semibold hover:bg-teal-600 transition-colors cursor-pointer"
              @click="initCamera"
            >
              Reintentar permiso
            </button>
          </div>
        </div>

        <!-- Camera Device Selection & Controls Toolbar -->
        <div class="flex items-center justify-between gap-2 px-1">
          <!-- Device selector if multiple cameras -->
          <div class="flex-1 max-w-[170px]">
            <select
              v-if="hasMultipleCameras"
              v-model="selectedCameraId"
              class="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 truncate cursor-pointer focus:ring-1 focus:ring-(--light-teal)"
              @change="onCameraDeviceChange"
            >
              <option
                v-for="(cam, idx) in cameras"
                :key="cam.deviceId"
                :value="cam.deviceId"
              >
                {{ cam.label || `Cámara ${idx + 1}` }}
              </option>
            </select>
            <span v-else class="text-xs text-slate-400">
              <i class="fa-solid fa-video text-slate-400 mr-1"></i> Cámara activa
            </span>
          </div>

          <!-- Central Shutter Button -->
          <button
            type="button"
            class="w-16 h-16 rounded-full bg-(--light-teal) border-4 border-white shadow-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-white"
            :disabled="!isCameraEnabled || isCameraLoading"
            title="Tomar foto"
            @click="captureFromCamera"
          >
            <i class="fa-solid fa-camera text-xl"></i>
          </button>

          <!-- Action buttons (Switch camera / switch to upload) -->
          <div class="flex-1 flex justify-end gap-2">
            <button
              v-if="hasMultipleCameras"
              type="button"
              class="w-10 h-10 border border-slate-200 bg-white rounded-xl flex justify-center items-center text-slate-600 hover:bg-slate-50 hover:text-(--primary-blue) transition-colors cursor-pointer"
              title="Alternar cámara"
              @click="cycleCamera"
            >
              <i class="fa-solid fa-arrows-rotate"></i>
            </button>

            <button
              type="button"
              class="w-10 h-10 border border-slate-200 bg-white rounded-xl flex justify-center items-center text-slate-600 hover:bg-slate-50 hover:text-(--primary-blue) transition-colors cursor-pointer"
              title="Subir imagen desde equipo"
              @click="goToStep('upload')"
            >
              <i class="fa-regular fa-image"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Step 4: Adjust / Crop Image -->
      <div v-if="editorStep === 'adjust'" class="py-1">
        <p class="text-center text-slate-500 text-xs mb-3">
          Arrastra para centrar o usa los controles para hacer zoom
        </p>

        <!-- Canvas Container with Circular Mask Guide -->
        <div class="w-full max-w-[320px] aspect-square mx-auto mb-4 relative overflow-hidden rounded-2xl bg-slate-900 shadow-md">
          <canvas
            ref="canvasElement"
            class="w-full h-full block cursor-grab active:cursor-grabbing touch-none"
            @mousedown="(e) => startCanvasDrag(e.clientX, e.clientY)"
            @mousemove="(e) => moveCanvasDrag(e.clientX, e.clientY)"
            @mouseup="endCanvasDrag"
            @mouseleave="endCanvasDrag"
            @touchstart="onTouchStart"
            @touchmove="onTouchMove"
            @touchend="onTouchEnd"
            @wheel="onCanvasWheel"
          ></canvas>

          <!-- Translucent mask guide for circle avatar -->
          <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div class="w-full h-full rounded-full border-2 border-white/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.6)]"></div>
          </div>
        </div>

        <!-- Zoom Slider & Controls -->
        <div class="flex items-center justify-center gap-3 mb-6 px-4">
          <button
            type="button"
            class="w-9 h-9 border border-slate-200 bg-white rounded-xl flex justify-center items-center text-slate-600 hover:bg-slate-50 hover:text-(--primary-blue) transition-colors cursor-pointer shadow-xs"
            title="Alejar"
            @click="handleZoom(-0.1)"
          >
            <i class="fa-solid fa-minus text-xs"></i>
          </button>

          <input
            type="range"
            min="0.5"
            max="3"
            step="0.05"
            :value="zoomScale"
            class="flex-1 accent-(--light-teal) cursor-pointer"
            aria-label="Control de zoom"
            @input="onZoomSliderInput"
          />

          <button
            type="button"
            class="w-9 h-9 border border-slate-200 bg-white rounded-xl flex justify-center items-center text-slate-600 hover:bg-slate-50 hover:text-(--primary-blue) transition-colors cursor-pointer shadow-xs"
            title="Acercar"
            @click="handleZoom(0.1)"
          >
            <i class="fa-solid fa-plus text-xs"></i>
          </button>

          <button
            type="button"
            class="w-9 h-9 border border-slate-200 bg-white rounded-xl flex justify-center items-center text-slate-500 hover:bg-slate-50 hover:text-(--primary-blue) transition-colors cursor-pointer shadow-xs"
            title="Restablecer posición y zoom"
            @click="resetAdjust"
          >
            <i class="fa-solid fa-rotate-left text-xs"></i>
          </button>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-between items-center gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            class="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-(--primary-blue) font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
            @click="closeEditor"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="px-6 py-2.5 rounded-xl bg-(--light-teal) text-white font-semibold text-sm hover:bg-teal-600 transition-colors cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
            :disabled="isSavingPhoto"
            @click="saveCroppedAvatar"
          >
            <i :class="isSavingPhoto ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'"></i>
            <span>{{ isSavingPhoto ? "Guardando..." : isProvider ? "Guardar logo" : "Guardar foto" }}</span>
          </button>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

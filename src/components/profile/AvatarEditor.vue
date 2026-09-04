<script setup lang="ts">


import { ref, nextTick, onBeforeUnmount } from "vue";
import BaseModal from "../common/BaseModal.vue";
import ConfirmModal from "../common/ConfirmModal.vue";
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

defineExpose({
  openEditor
});

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
const handleFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) processUploadedFile(input.files[0]);
};

const handleFileDrop = (event: DragEvent) => {
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    processUploadedFile(event.dataTransfer.files[0]);
  }
};

const processUploadedFile = (file: File) => {
  if (!file.type.startsWith("image/")) {
    alert("Por favor selecciona un archivo de imagen válido.");
    return;
  }
  if (file.size > 3 * 1024 * 1024) {
    alert("La imagen excede el límite de 3MB.");
    return;
  }
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
      // Create the File object and emit it to the parent
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
</script>

<template>
  <div class="avatar-editor-wrapper">
    <!-- Avatar Display & Dropdown -->
    <div class="avatar-container">
      <div class="avatar">
        <ProfileAvatar v-if="!isProvider" :blob-id="blobId" :alt="alt" />
        <ProviderLogo v-else :blob-id="blobId" :alt="alt" />
      </div>
      <button type="button" class="edit-avatar-btn" aria-label="Cambiar foto" @click="toggleDropdown">
        <i class="fa-solid fa-camera"></i>
      </button>

      <div v-if="isDropdownOpen" class="avatar-dropdown">
        <button class="dropdown-item" @click="openEditor('choice')">
          <i class="fa-solid fa-rotate"></i> Cambiar Foto
        </button>
        <button v-if="blobId" class="dropdown-item" @click="() => { closeDropdown(); showViewModal = true; }">
          <i class="fa-regular fa-image"></i> Ver foto
        </button>
        <div v-if="blobId" class="dropdown-divider"></div>
        <button v-if="blobId" class="dropdown-item danger" @click="() => { closeDropdown(); showDeleteModal = true; }">
          <i class="fa-regular fa-trash-can"></i> Eliminar Foto
        </button>
      </div>
    </div>

    <!-- View Photo Modal -->
    <BaseModal v-model="showViewModal" max-width="400px" @close="showViewModal = false">
      <div class="view-photo-container">
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
        <div class="modal-nav-header">
          <button class="btn-back-nav" @click="closeEditor"><i class="fa-solid fa-arrow-left"></i></button>
          <h3 class="modal-heading">
            {{ editorStep === "camera" ? "Tomar Foto" : editorStep === "adjust" ? "Ajustar Foto" : "Cambiar Foto" }}
          </h3>
          <button class="btn-close-circle" @click="closeEditor"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </template>

      <!-- Step 1: Choice -->
      <div v-if="editorStep === 'choice'" class="choice-container">
        <div class="choice-avatar"><i class="fa-solid fa-user"></i></div>
        <p class="choice-subtitle">Elige cómo cambiar tu foto</p>
        <button class="btn-choice" @click="editorStep = 'upload'">
          <div class="choice-icon"><i class="fa-regular fa-image"></i></div>
          <div class="choice-text"><h4>Seleccionar una imagen</h4><p>Desde tu equipo</p></div>
          <i class="fa-solid fa-chevron-right choice-arrow"></i>
        </button>
        <button class="btn-choice secondary" @click="() => { editorStep = 'camera'; startCameraStream(); }">
          <div class="choice-icon"><i class="fa-solid fa-camera"></i></div>
          <div class="choice-text"><h4>Tomar una foto</h4><p>Usa tu cámara</p></div>
          <i class="fa-solid fa-chevron-right choice-arrow"></i>
        </button>
      </div>

      <!-- Step 2: Upload -->
      <div v-if="editorStep === 'upload'" class="upload-view">
        <div class="drag-drop-zone" @dragover.prevent @drop.prevent="handleFileDrop">
          <i class="fa-solid fa-cloud-arrow-up cloud-icon"></i>
          <p>Arrastra una imagen aquí</p><span>o</span>
          <label class="btn-outline">
            Seleccionar archivo
            <input type="file" accept="image/png, image/jpeg" style="display: none" @change="handleFileSelected" />
          </label>
        </div>
        <div class="upload-info"><p>Formatos: JPG, PNG</p><p>Tamaño máx: 3MB</p></div>
        <div class="upload-controls"><button class="btn-secondary" @click="editorStep = 'choice'">Atrás</button></div>
      </div>

      <!-- Step 3: Camera -->
      <div v-if="editorStep === 'camera'" class="camera-view">
        <div class="camera-container">
          <video ref="videoElement" autoplay playsinline class="camera-stream"></video>
          <div v-if="!cameraActive" class="camera-overlay-message"><i class="fa-solid fa-camera"></i><p>Se necesita acceso a la cámara.</p></div>
        </div>
        <div class="camera-controls">
          <button class="btn-secondary" @click="() => { stopCameraStream(); editorStep = 'choice'; }">Cancelar</button>
          <button class="btn-shutter" :disabled="!cameraActive" @click="captureFromCamera"></button>
          <button class="btn-icon" @click="() => { stopCameraStream(); editorStep = 'upload'; }"><i class="fa-solid fa-image"></i></button>
        </div>
      </div>

      <!-- Step 4: Adjust/Crop -->
      <div v-if="editorStep === 'adjust'" class="adjust-view">
        <p class="adjust-instruction">Arrastra la imagen para centrarla.</p>
        <div class="adjust-container">
          <canvas
            ref="canvasElement"
            class="photo-canvas"
            @mousedown="(e) => startCanvasDrag(e.clientX, e.clientY)"
            @mousemove="(e) => moveCanvasDrag(e.clientX, e.clientY)"
            @mouseup="endCanvasDrag"
            @mouseleave="endCanvasDrag"
            @touchstart="(e) => startCanvasDrag(e.touches[0].clientX, e.touches[0].clientY)"
            @touchmove="(e) => moveCanvasDrag(e.touches[0].clientX, e.touches[0].clientY)"
            @touchend="endCanvasDrag"
          ></canvas>
          <div class="adjust-overlay"><div class="crop-circle"></div></div>
        </div>
        <div class="adjust-controls-top">
          <button type="button" class="btn-icon circle" @click="handleZoom(-0.1)"><i class="fa-solid fa-minus"></i></button>
          <button type="button" class="btn-icon circle" @click="handleZoom(0.1)"><i class="fa-solid fa-plus"></i></button>
        </div>
        <div class="adjust-controls-bottom">
          <button type="button" class="btn-secondary" @click="closeEditor">Cancelar</button>
          <button type="button" class="btn-primary" :disabled="isSavingPhoto" @click="saveCroppedAvatar">
            <i :class="isSavingPhoto ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'"></i>
            {{ isSavingPhoto ? "Guardando..." : "Usar foto" }}
          </button>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<style scoped>
/* Wrapper & Avatar Display */
.avatar-editor-wrapper { position: relative; width: 150px; height: 150px; flex-shrink: 0; }
.avatar-container { position: relative; width: 100%; height: 100%; }
.avatar { width: 100%; height: 100%; border-radius: 50%; overflow: hidden; font-size: 4.5rem; }
.edit-avatar-btn { position: absolute; bottom: 4px; right: 8px; background-color: var(--primary-blue); color: #ffffff; border: 3px solid #ffffff; width: 38px; height: 38px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; font-size: 1rem; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); z-index: 2; }

/* Dropdown */
.avatar-dropdown { position: absolute; top: 0; left: 105%; background: #ffffff; border: 1px solid var(--border-gray); border-radius: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15); padding: 0.4rem 0; min-width: 160px; z-index: 200; }
.dropdown-item { display: flex; align-items: center; gap: 0.75rem; width: 100%; padding: 0.6rem 1rem; border: none; background: none; font-size: 0.9rem; color: var(--text-dark); cursor: pointer; text-align: left; }
.dropdown-item:hover { background-color: var(--bg-gray); }
.dropdown-item.danger { color: #ef4444; }
.dropdown-divider { height: 1px; background-color: var(--border-gray); margin: 0.3rem 0; }

/* View Modal */
.view-photo-container { display: flex; justify-content: center; align-items: center; padding: 1rem 0; width: 240px; height: 240px; margin: 0 auto; font-size: 6rem; }

/* Modal Headers */
.modal-nav-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.modal-heading { font-size: 1.3rem; color: var(--primary-blue); }
.btn-back-nav { background: none; border: none; font-size: 1.2rem; color: var(--primary-blue); cursor: pointer; }
.btn-close-circle { background: var(--primary-orange); color: #ffffff; border: none; width: 30px; height: 30px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; }

/* Choice Step */
.choice-container { text-align: center; }
.choice-avatar { width: 80px; height: 80px; border-radius: 50%; background-color: #64748b; color: #ffffff; font-size: 2.6rem; display: flex; justify-content: center; align-items: center; margin: 0 auto 0.75rem auto; }
.choice-subtitle { color: #64748b; font-size: 0.92rem; margin-bottom: 1.5rem; }
.btn-choice { display: flex; align-items: center; width: 100%; padding: 1rem; border: 1.5px solid var(--light-teal); border-radius: 12px; background: #ffffff; margin-bottom: 0.85rem; cursor: pointer; text-align: left; }
.btn-choice.secondary { border-color: var(--border-gray); }
.choice-icon { width: 45px; height: 45px; border-radius: 50%; background-color: #d8f1ef; color: var(--light-teal); display: flex; justify-content: center; align-items: center; font-size: 1.3rem; margin-right: 1rem; }
.btn-choice.secondary .choice-icon { background-color: var(--bg-gray); color: #64748b; }
.choice-text h4 { color: var(--primary-blue); font-size: 0.95rem; margin-bottom: 0.15rem; }
.choice-text p { font-size: 0.82rem; color: #64748b; }
.choice-arrow { margin-left: auto; color: var(--light-teal); }

/* Upload Step */
.drag-drop-zone { border: 2px dashed var(--border-gray); border-radius: 12px; padding: 2.5rem 1rem; text-align: center; color: #64748b; background-color: var(--bg-gray); margin-bottom: 1rem; }
.cloud-icon { font-size: 3rem; color: #94a3b8; margin-bottom: 0.5rem; }
.btn-outline { border: 1px solid var(--light-teal); background: #ffffff; color: var(--light-teal); padding: 0.45rem 1.4rem; border-radius: 8px; font-weight: 600; cursor: pointer; display: inline-block; margin-top: 0.5rem; }
.upload-info { text-align: center; font-size: 0.82rem; color: #94a3b8; margin-bottom: 1.5rem; }
.upload-controls { display: flex; justify-content: space-between; }

/* Camera Step */
.camera-container { width: 100%; height: 280px; background-color: #000000; border-radius: 12px; overflow: hidden; position: relative; display: flex; justify-content: center; align-items: center; margin-bottom: 1.5rem; }
.camera-stream { width: 100%; height: 100%; object-fit: cover; }
.camera-overlay-message { position: absolute; color: #ffffff; text-align: center; }
.camera-controls { display: flex; align-items: center; justify-content: space-between; }
.btn-shutter { width: 54px; height: 54px; border-radius: 50%; background-color: var(--light-teal); border: 3px solid #ffffff; box-shadow: 0 0 0 2px var(--border-gray); cursor: pointer; }
.btn-icon { width: 42px; height: 42px; border: 1px solid var(--border-gray); background: #ffffff; border-radius: 8px; display: flex; justify-content: center; align-items: center; cursor: pointer; }
.btn-icon.circle { border-radius: 50%; }

/* Adjust Step */
.adjust-instruction { text-align: center; color: #64748b; font-size: 0.88rem; margin-bottom: 0.75rem; }
.adjust-container { width: 100%; max-width: 300px; aspect-ratio: 1 / 1; margin: 0 auto 1rem auto; position: relative; overflow: hidden; border-radius: 10px; background-color: #f1f5f9; }
.photo-canvas { width: 100%; height: 100%; display: block; cursor: grab; }
.photo-canvas:active { cursor: grabbing; }
.adjust-overlay { position: absolute; inset: 0; pointer-events: none; }
.crop-circle { width: 100%; height: 100%; border-radius: 50%; border: 2px solid rgba(0, 0, 0, 0.8); box-shadow: 0 0 0 9999px rgba(255, 255, 255, 0.4); }
.adjust-controls-top { display: flex; justify-content: center; gap: 1.5rem; margin-bottom: 1.5rem; }
.adjust-controls-bottom { display: flex; justify-content: space-between; }

/* Generic Buttons */
.btn-secondary { background: #ffffff; border: 1px solid var(--border-gray); color: var(--primary-blue); padding: 0.6rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; }
.btn-primary { background-color: var(--light-teal); color: #ffffff; border: none; padding: 0.6rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; }

/* Responsive */
@media (max-width: 768px) {
  .avatar-dropdown { left: 50%; transform: translateX(-50%); top: 105%; }
}
</style>

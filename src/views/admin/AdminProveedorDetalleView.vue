<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "reka-ui";
import { useMockProvidersStore } from "@/stores/admin/mockProvidersStore";
import { useToastStore } from "@/stores/ui";

const route = useRoute();
const router = useRouter();
const mockStore = useMockProvidersStore();
const toastStore = useToastStore();

const providerId = computed(() => (route.params.id as string) || "prov-1");
const provider = computed(() => {
  return mockStore.getProviderById(providerId.value) || mockStore.providers[0];
});

const activeTab = ref<"info" | "docs" | "history">("info");

// --- Modal States ---
const isApproveModalOpen = ref(false);
const isRejectModalOpen = ref(false);
const isDocPreviewOpen = ref(false);
const isSubmitting = ref(false);

// Document Preview state
const previewDoc = ref<{ name: string; filename: string; filesize: string; type: "pdf" | "image" } | null>(null);

// Rejection Form
const rejectionReason = ref("Documentación inválida o incompleta");
const rejectionNotes = ref("");

const REJECTION_OPTIONS = [
  "Documentación inválida o incompleta",
  "La información no coincide",
  "El RUC no es válido",
  "El tipo de negocio no corresponde",
  "Otro motivo",
];

// --- Handlers ---
function goBack() {
  router.push({ name: "admin-providers" });
}

function openDocPreview(doc: { name: string; filename: string; filesize: string; type: "pdf" | "image" }) {
  previewDoc.value = doc;
  isDocPreviewOpen.value = true;
}

async function handleConfirmApprove() {
  if (!provider.value) return;
  isSubmitting.value = true;

  // Realistic UI delay
  await new Promise((resolve) => setTimeout(resolve, 400));

  mockStore.approveProvider(provider.value.id);
  isSubmitting.value = false;
  isApproveModalOpen.value = false;

  toastStore.addToast({
    title: "Cuenta aprobada",
    message: `La cuenta de ${provider.value.businessName} ha sido verificada con éxito.`,
    variant: "success",
  });
}

async function handleConfirmReject() {
  if (!provider.value) return;
  isSubmitting.value = true;

  // Realistic UI delay
  await new Promise((resolve) => setTimeout(resolve, 400));

  mockStore.rejectProvider(provider.value.id, rejectionReason.value, rejectionNotes.value);
  isSubmitting.value = false;
  isRejectModalOpen.value = false;

  toastStore.addToast({
    title: "Cuenta rechazada",
    message: "Se ha registrado el rechazo de la solicitud y notificado al importador.",
    variant: "error",
  });
}
</script>

<template>
  <div v-if="provider" class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
    <!-- Back Button -->
    <div>
      <button
        type="button"
        @click="goBack"
        class="inline-flex items-center gap-2 text-xs font-bold text-[#00a896] hover:text-[#023859] hover:underline cursor-pointer transition-colors"
      >
        <i class="fa-solid fa-arrow-left text-xs"></i>
        <span>Volver a proveedores</span>
      </button>
    </div>

    <!-- Header Section (matching screenshot 2) -->
    <div>
      <h1 class="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#023859]">
        Detalle del usuario
      </h1>
      <p class="text-xs sm:text-sm text-slate-500 mt-1">
        Revisa la información del importador y sus documentos para aprobar o rechazar su cuenta.
      </p>
    </div>

    <!-- Top User Card (matching screenshot 2) -->
    <div class="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-3.5">
        <!-- Avatar Circle -->
        <div
          :class="[
            'h-12 w-12 shrink-0 flex items-center justify-center rounded-full text-white font-bold text-sm shadow-2xs',
            provider.avatarBg
          ]"
        >
          {{ provider.userInitials }}
        </div>

        <!-- Name & Status -->
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-base sm:text-lg font-bold text-[#023859]">
              {{ provider.userName }}
            </h2>
            <span
              :class="[
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                provider.status === 'Pendiente'
                  ? 'bg-orange-50 text-[#ea580c] border border-orange-200/60'
                  : provider.status === 'Aprobado'
                  ? 'bg-teal-50 text-[#00a896] border border-teal-200/60'
                  : 'bg-red-50 text-red-600 border border-red-200/60'
              ]"
            >
              <span
                :class="[
                  'h-1.5 w-1.5 rounded-full',
                  provider.status === 'Pendiente'
                    ? 'bg-[#ea580c]'
                    : provider.status === 'Aprobado'
                    ? 'bg-[#00a896]'
                    : 'bg-red-500'
                ]"
              ></span>
              {{ provider.status }}
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">
            {{ provider.role }} · Registrado el {{ provider.registeredAt }}
          </p>
        </div>
      </div>

      <!-- Right Contact Info -->
      <div class="space-y-1 text-xs text-slate-500">
        <div class="flex items-center gap-2">
          <i class="fa-regular fa-envelope text-slate-400 text-xs w-4"></i>
          <span>{{ provider.userEmail }}</span>
        </div>
        <div class="flex items-center gap-2 font-mono">
          <i class="fa-regular fa-id-card text-slate-400 text-xs w-4"></i>
          <span>{{ provider.ruc }}</span>
        </div>
      </div>
    </div>

    <!-- Tabs Container -->
    <TabsRoot v-model="activeTab" class="space-y-6">
      <TabsList class="flex items-center gap-6 border-b border-slate-200 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <TabsTrigger
          value="info"
          class="pb-3 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer border-b-2 data-[state=active]:border-[#00a896] data-[state=active]:text-[#00a896] data-[state=inactive]:border-transparent data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 outline-none"
        >
          Información
        </TabsTrigger>

        <TabsTrigger
          value="docs"
          class="pb-3 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer border-b-2 data-[state=active]:border-[#00a896] data-[state=active]:text-[#00a896] data-[state=inactive]:border-transparent data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 outline-none"
        >
          Documentos ({{ provider.documents.length }})
        </TabsTrigger>

        <TabsTrigger
          value="history"
          class="pb-3 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer border-b-2 data-[state=active]:border-[#00a896] data-[state=active]:text-[#00a896] data-[state=inactive]:border-transparent data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 outline-none"
        >
          Historial
        </TabsTrigger>
      </TabsList>

      <!-- TAB 1: INFORMACIÓN -->
      <TabsContent value="info" class="outline-none">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- Left Column (approx 65%) -->
          <div class="lg:col-span-8 space-y-6">
            <!-- Card: Información del negocio (matching screenshot 2) -->
            <div class="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-xs space-y-5">
              <div class="flex items-center justify-between border-b border-slate-100 pb-4">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0284c7]">
                    <i class="fa-solid fa-store text-sm"></i>
                  </div>
                  <h3 class="text-sm sm:text-base font-bold text-slate-800">
                    Información del negocio
                  </h3>
                </div>

                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00a896] hover:underline cursor-pointer"
                >
                  <i class="fa-solid fa-pencil text-[11px]"></i>
                  <span>Editar</span>
                </button>
              </div>

              <!-- Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                <div>
                  <span class="text-slate-400 block font-medium">Nombre del negocio</span>
                  <p class="font-bold text-slate-800 text-sm mt-0.5">{{ provider.businessName }}</p>
                </div>

                <div>
                  <span class="text-slate-400 block font-medium">RUC</span>
                  <p class="font-mono font-bold text-slate-800 text-sm mt-0.5">{{ provider.ruc }}</p>
                </div>

                <div>
                  <span class="text-slate-400 block font-medium">Tipo de negocio</span>
                  <p class="font-semibold text-slate-700 mt-0.5">{{ provider.businessType }}</p>
                </div>

                <div>
                  <span class="text-slate-400 block font-medium">Correo del negocio</span>
                  <p class="font-semibold text-slate-700 mt-0.5">{{ provider.businessEmail }}</p>
                </div>

                <div>
                  <span class="text-slate-400 block font-medium">Teléfono del negocio</span>
                  <p class="font-semibold text-slate-700 mt-0.5">{{ provider.businessPhone }}</p>
                </div>

                <div>
                  <span class="text-slate-400 block font-medium">Descripción</span>
                  <p class="text-slate-600 mt-0.5 leading-relaxed">{{ provider.description }}</p>
                </div>

                <div class="sm:col-span-2">
                  <span class="text-slate-400 block font-medium">Dirección</span>
                  <p class="font-semibold text-slate-700 mt-0.5">{{ provider.address }}</p>
                </div>
              </div>

              <!-- Logo del negocio section -->
              <div class="pt-2">
                <span class="text-slate-400 block text-xs font-medium mb-2">Logo del negocio</span>
                <div class="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3 max-w-sm">
                  <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100/70 text-[#ea580c]">
                      <i class="fa-solid fa-store text-base"></i>
                    </div>
                    <div>
                      <p class="font-semibold text-slate-800 text-xs">{{ provider.logoFilename }}</p>
                      <p class="text-slate-400 text-[11px]">{{ provider.logoFilesize }}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    @click="openDocPreview({ name: 'Logo del negocio', filename: provider.logoFilename, filesize: provider.logoFilesize, type: 'image' })"
                    class="inline-flex items-center gap-1 text-xs font-semibold text-[#00a896] hover:underline cursor-pointer"
                  >
                    <i class="fa-regular fa-eye text-xs"></i>
                    <span>Ver</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Card: Información del propietario (matching screenshot 2) -->
            <div class="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-xs space-y-5">
              <div class="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0284c7]">
                  <i class="fa-solid fa-user text-sm"></i>
                </div>
                <h3 class="text-sm sm:text-base font-bold text-slate-800">
                  Información del propietario
                </h3>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                <div>
                  <span class="text-slate-400 block font-medium">Nombre completo</span>
                  <p class="font-bold text-slate-800 text-sm mt-0.5">{{ provider.userName }}</p>
                </div>

                <div>
                  <span class="text-slate-400 block font-medium">Correo electrónico</span>
                  <p class="font-semibold text-slate-700 mt-0.5">{{ provider.userEmail }}</p>
                </div>

                <div>
                  <span class="text-slate-400 block font-medium">Cédula</span>
                  <p class="font-mono font-bold text-slate-800 text-sm mt-0.5">
                    {{ provider.userNationalId }}
                  </p>
                </div>

                <div>
                  <span class="text-slate-400 block font-medium">Teléfono</span>
                  <p class="font-semibold text-slate-700 mt-0.5">{{ provider.userPhone }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column (approx 35%) -->
          <div class="lg:col-span-4 space-y-6">
            <!-- Card 1: Estado de Verificación Banner (matching screenshot 2) -->
            <div
              :class="[
                'rounded-2xl border p-4 sm:p-5 shadow-2xs space-y-2',
                provider.status === 'Pendiente'
                  ? 'border-amber-200/70 bg-[#fffbeb]'
                  : provider.status === 'Aprobado'
                  ? 'border-teal-200/70 bg-[#f0fdfa]'
                  : 'border-red-200/70 bg-[#fef2f2]'
              ]"
            >
              <div class="flex items-center gap-2.5">
                <i
                  :class="[
                    'text-base',
                    provider.status === 'Pendiente'
                      ? 'fa-regular fa-clock text-amber-500'
                      : provider.status === 'Aprobado'
                      ? 'fa-solid fa-circle-check text-[#00a896]'
                      : 'fa-solid fa-circle-xmark text-red-500'
                  ]"
                ></i>
                <h4
                  :class="[
                    'text-xs sm:text-sm font-bold',
                    provider.status === 'Pendiente'
                      ? 'text-amber-900'
                      : provider.status === 'Aprobado'
                      ? 'text-teal-900'
                      : 'text-red-900'
                  ]"
                >
                  {{
                    provider.status === 'Pendiente'
                      ? 'Cuenta pendiente de verificación'
                      : provider.status === 'Aprobado'
                      ? 'Cuenta verificada con éxito'
                      : 'Cuenta rechazada'
                  }}
                </h4>
              </div>
              <p
                :class="[
                  'text-xs leading-relaxed',
                  provider.status === 'Pendiente'
                    ? 'text-amber-800/80'
                    : provider.status === 'Aprobado'
                    ? 'text-teal-800/80'
                    : 'text-red-800/80'
                ]"
              >
                {{
                  provider.status === 'Pendiente'
                    ? 'Revisa la información y los documentos del importador. Si todo es correcto, aprueba la cuenta para que pueda publicar productos.'
                    : provider.status === 'Aprobado'
                    ? 'Este importador ya está verificado y tiene permisos activos para publicar su catálogo en Mercanto.'
                    : provider.rejectionReason
                    ? `Motivo: ${provider.rejectionReason}. El usuario puede corregir su información y registrarse nuevamente.`
                    : 'La solicitud no cumplió con los requerimientos legales.'
                }}
              </p>
            </div>

            <!-- Card 2: Documentos de verificación (matching screenshot 2 & 3) -->
            <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-4">
              <div>
                <div class="flex items-center gap-2.5">
                  <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-[#0284c7]">
                    <i class="fa-regular fa-file-lines text-xs"></i>
                  </div>
                  <h4 class="text-xs sm:text-sm font-bold text-slate-800">
                    Documentos de verificación
                  </h4>
                </div>
                <p class="text-[11px] text-slate-400 mt-1">
                  Revisa que los documentos sean válidos y correspondan con la información registrada.
                </p>
              </div>

              <!-- Documents List -->
              <div class="space-y-2.5">
                <div
                  v-for="doc in provider.documents"
                  :key="doc.id"
                  class="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-[#0284c7]">
                      <i :class="doc.type === 'image' ? 'fa-regular fa-image' : 'fa-regular fa-id-badge'"></i>
                    </div>
                    <div class="min-w-0">
                      <p class="font-semibold text-slate-800 text-xs truncate">{{ doc.name }}</p>
                      <p class="text-slate-400 text-[11px] truncate">{{ doc.filename }} · {{ doc.filesize }}</p>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <span class="inline-flex items-center gap-1 rounded-full border border-teal-200/50 bg-[#f0fdfa] px-2 py-0.5 text-[10px] font-semibold text-[#00a896]">
                      <span class="h-1.5 w-1.5 rounded-full bg-[#14b8a6]"></span>
                      {{ doc.status }}
                    </span>
                    <button
                      type="button"
                      @click="openDocPreview(doc)"
                      class="inline-flex items-center gap-1 text-xs font-semibold text-[#00a896] hover:underline cursor-pointer"
                    >
                      <i class="fa-regular fa-eye text-xs"></i>
                      <span>Ver</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card 3: Criterios de verificación (matching screenshot 2) -->
            <div class="rounded-2xl border border-sky-100 bg-[#f0f8ff] p-4 sm:p-5 shadow-2xs space-y-2.5">
              <div class="flex items-center gap-2">
                <i class="fa-regular fa-circle-question text-sky-600 text-sm"></i>
                <h4 class="text-xs sm:text-sm font-bold text-slate-800">
                  Criterios de verificación
                </h4>
              </div>

              <ul class="space-y-1.5 text-xs text-slate-600 leading-relaxed list-disc list-inside">
                <li>La información del negocio y del propietario debe coincidir con los documentos.</li>
                <li>El RUC debe estar vigente y ser legible.</li>
                <li>La cédula debe corresponder al propietario registrado.</li>
                <li>Verifica que el logo corresponda a la empresa.</li>
              </ul>
            </div>

            <!-- Bottom Action Buttons: Rechazar / Aprobar (matching screenshot 2) -->
            <div class="flex items-center gap-3 pt-2">
              <button
                type="button"
                @click="isRejectModalOpen = true"
                class="flex-1 rounded-xl border border-red-300 bg-white py-2.5 text-xs font-bold text-red-600 shadow-2xs hover:bg-red-50 active:scale-95 transition-all cursor-pointer"
              >
                Rechazar cuenta
              </button>

              <button
                type="button"
                @click="isApproveModalOpen = true"
                class="flex-1 rounded-xl bg-[#ff6a00] hover:bg-[#ea580c] py-2.5 text-xs font-bold text-white shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                Aprobar cuenta
              </button>
            </div>
          </div>
        </div>
      </TabsContent>

      <!-- TAB 2: DOCUMENTOS -->
      <TabsContent value="docs" class="outline-none space-y-4">
        <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-4">
          <h3 class="text-sm font-bold text-slate-800">Todos los documentos adjuntos</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="doc in provider.documents"
              :key="doc.id"
              class="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
            >
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-[#0284c7]">
                    <i :class="doc.type === 'image' ? 'fa-regular fa-image text-base' : 'fa-regular fa-file-pdf text-base'"></i>
                  </div>
                  <div>
                    <p class="font-bold text-slate-800 text-xs">{{ doc.name }}</p>
                    <p class="text-[11px] text-slate-400">{{ doc.filename }}</p>
                  </div>
                </div>

                <span class="inline-flex items-center gap-1 rounded-full border border-teal-200/50 bg-[#f0fdfa] px-2 py-0.5 text-[10px] font-semibold text-[#00a896]">
                  {{ doc.status }}
                </span>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs text-slate-500">
                <span>{{ doc.filesize }}</span>
                <button
                  type="button"
                  @click="openDocPreview(doc)"
                  class="font-semibold text-[#00a896] hover:underline cursor-pointer"
                >
                  <i class="fa-regular fa-eye mr-1"></i> Visualizar
                </button>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <!-- TAB 3: HISTORIAL -->
      <TabsContent value="history" class="outline-none space-y-4">
        <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-5">
          <h3 class="text-sm font-bold text-slate-800">Línea de tiempo de la solicitud</h3>

          <div class="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            <div
              v-for="(hist, idx) in provider.history"
              :key="idx"
              class="relative"
            >
              <div
                :class="[
                  'absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-white',
                  idx === 0 && provider.status === 'Aprobado'
                    ? 'bg-[#00a896]'
                    : idx === 0 && provider.status === 'Rechazado'
                    ? 'bg-red-500'
                    : 'bg-amber-500'
                ]"
              ></div>

              <div class="space-y-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h4 class="text-xs sm:text-sm font-bold text-slate-800">{{ hist.title }}</h4>
                  <span class="text-[11px] text-slate-400 font-medium">{{ hist.date }}</span>
                </div>
                <p class="text-xs text-slate-600 leading-relaxed">{{ hist.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
    </TabsRoot>

    <!-- MODAL 1: RECHAZAR CUENTA (matching screenshot 3) -->
    <DialogRoot v-model:open="isRejectModalOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity" />
        <DialogContent class="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
          <!-- Modal Top Header -->
          <div class="flex items-center justify-between">
            <DialogTitle class="text-sm font-bold text-slate-700">
              Rechazar cuenta del importador
            </DialogTitle>
            <DialogClose class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer">
              <i class="fa-solid fa-xmark text-base"></i>
            </DialogClose>
          </div>

          <!-- Red Circle Icon & Prompt -->
          <div class="flex flex-col items-center text-center space-y-2 pt-2">
            <div class="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-md shadow-red-500/20">
              <i class="fa-solid fa-xmark text-2xl"></i>
            </div>
            <h3 class="text-base sm:text-lg font-bold text-slate-800">
              ¿Por qué deseas rechazar esta cuenta?
            </h3>
            <p class="text-xs text-slate-400">
              Se enviará un correo al usuario con el motivo del rechazo.
            </p>
          </div>

          <!-- Radio Options -->
          <div class="space-y-2.5 pt-1">
            <label
              v-for="opt in REJECTION_OPTIONS"
              :key="opt"
              class="flex items-center gap-3 cursor-pointer group text-xs text-slate-700 select-none"
            >
              <input
                type="radio"
                name="rejection_reason"
                :value="opt"
                v-model="rejectionReason"
                class="h-4 w-4 text-red-600 focus:ring-red-500 border-slate-300 cursor-pointer"
              />
              <span class="group-hover:text-slate-900">{{ opt }}</span>
            </label>
          </div>

          <!-- Textarea for notes -->
          <div class="space-y-1">
            <div class="relative">
              <textarea
                v-model="rejectionNotes"
                maxlength="500"
                rows="3"
                placeholder="Especifica el motivo del rechazo..."
                class="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder-slate-400 transition-colors focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/15"
              ></textarea>
              <div class="text-right text-[10px] text-slate-400 -mt-1 pr-1">
                {{ rejectionNotes.length }}/500
              </div>
            </div>
          </div>

          <!-- Notice Alert Box (matching screenshot 3) -->
          <div class="rounded-xl border border-red-100 bg-red-50/60 p-3 flex items-start gap-3">
            <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-500 mt-0.5">
              <i class="fa-regular fa-envelope text-xs"></i>
            </div>
            <p class="text-[11px] text-red-700 leading-snug">
              El usuario recibirá un correo con el motivo del rechazo y podrá corregir la información y registrarse nuevamente.
            </p>
          </div>

          <!-- Modal Action Buttons (matching screenshot 3) -->
          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              :disabled="isSubmitting"
              @click="isRejectModalOpen = false"
              class="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              :disabled="isSubmitting"
              @click="handleConfirmReject"
              class="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#e53e3e] hover:bg-red-700 py-2.5 text-xs font-bold text-white shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <i v-if="isSubmitting" class="fa-solid fa-spinner animate-spin text-xs"></i>
              <span>Rechazar cuenta</span>
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <!-- MODAL 2: APROBAR CUENTA (matching screenshot 4) -->
    <DialogRoot v-model:open="isApproveModalOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity" />
        <DialogContent class="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
          <!-- Modal Top Header -->
          <div class="flex items-center justify-between">
            <DialogTitle class="text-sm font-bold text-slate-700">
              Aprobar cuenta de importador
            </DialogTitle>
            <DialogClose class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer">
              <i class="fa-solid fa-xmark text-base"></i>
            </DialogClose>
          </div>

          <!-- Header Titles -->
          <div class="text-center space-y-1.5 pt-1">
            <h3 class="text-base sm:text-lg font-bold text-slate-800">
              ¿Estás seguro de aprobar esta cuenta?
            </h3>
            <p class="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              El usuario podrá publicar sus productos y se le otorgará el check de verificado en la plataforma.
            </p>
          </div>

          <!-- User Summary Card (matching screenshot 4) -->
          <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 flex items-center gap-3">
            <div
              :class="[
                'h-11 w-11 shrink-0 flex items-center justify-center rounded-full text-white font-bold text-xs shadow-2xs',
                provider.avatarBg
              ]"
            >
              {{ provider.userInitials }}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <p class="font-bold text-slate-800 text-xs sm:text-sm truncate">{{ provider.userName }}</p>
                <span class="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-[#ea580c]">
                  <span class="h-1.5 w-1.5 rounded-full bg-[#ea580c]"></span>
                  Pendiente
                </span>
              </div>
              <p class="text-xs text-slate-600 truncate mt-0.5">{{ provider.businessName }}</p>
              <p class="text-[11px] text-slate-400 truncate">RUC {{ provider.ruc }} · {{ provider.role }}</p>
            </div>
          </div>

          <!-- Benefits Checklist Box (matching screenshot 4) -->
          <div class="rounded-xl border border-teal-200/70 bg-[#f0fdfa]/70 p-4 space-y-2.5">
            <div class="flex items-center gap-2 text-xs font-bold text-slate-800">
              <i class="fa-regular fa-circle-check text-[#00a896] text-sm"></i>
              <span>Al aprobar esta cuenta:</span>
            </div>

            <div class="space-y-2 pl-1 text-xs text-slate-700">
              <div class="flex items-start gap-2.5">
                <i class="fa-solid fa-circle-check text-[#00a896] text-xs mt-0.5"></i>
                <span>El usuario podrá publicar y gestionar sus productos.</span>
              </div>
              <div class="flex items-start gap-2.5">
                <i class="fa-solid fa-circle-check text-[#00a896] text-xs mt-0.5"></i>
                <span>Su negocio mostrará el estado de cuenta verificada.</span>
              </div>
              <div class="flex items-start gap-2.5">
                <i class="fa-solid fa-circle-check text-[#00a896] text-xs mt-0.5"></i>
                <span>Recibirá una notificación por correo sobre la aprobación.</span>
              </div>
            </div>
          </div>

          <!-- Modal Action Buttons (matching screenshot 4) -->
          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              :disabled="isSubmitting"
              @click="isApproveModalOpen = false"
              class="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              :disabled="isSubmitting"
              @click="handleConfirmApprove"
              class="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff6a00] hover:bg-[#ea580c] py-2.5 text-xs font-bold text-white shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <i v-if="isSubmitting" class="fa-solid fa-spinner animate-spin text-xs"></i>
              <i v-else class="fa-solid fa-check text-xs"></i>
              <span>Aprobar cuenta</span>
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <!-- MODAL 3: DOCUMENT PREVIEW MODAL -->
    <DialogRoot v-model:open="isDocPreviewOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity" />
        <DialogContent class="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2.5">
              <i class="fa-regular fa-file-pdf text-[#00a896] text-lg"></i>
              <div>
                <DialogTitle class="text-sm font-bold text-slate-800">
                  {{ previewDoc?.name }}
                </DialogTitle>
                <p class="text-[11px] text-slate-400">{{ previewDoc?.filename }} · {{ previewDoc?.filesize }}</p>
              </div>
            </div>
            <DialogClose class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer">
              <i class="fa-solid fa-xmark text-base"></i>
            </DialogClose>
          </div>

          <!-- Document Mock Display Box -->
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-6 flex flex-col items-center justify-center min-h-[260px] text-center space-y-3">
            <template v-if="previewDoc?.type === 'image'">
              <div class="h-28 w-28 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-700 font-bold">
                <i class="fa-solid fa-store text-4xl text-[#023859]"></i>
              </div>
              <div>
                <p class="text-xs font-bold text-slate-700">{{ provider.businessName }}</p>
                <p class="text-[11px] text-slate-400">Logotipo oficial registrado para catálogo</p>
              </div>
            </template>
            <template v-else>
              <div class="w-full max-w-sm rounded-xl bg-white border border-slate-200 p-4 shadow-xs space-y-2 text-left">
                <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">República de Nicaragua</span>
                  <span class="text-[10px] font-mono text-[#00a896] font-bold">DGI / CSE</span>
                </div>
                <p class="text-xs font-bold text-slate-800">{{ previewDoc?.name }}</p>
                <div class="text-[11px] space-y-0.5 text-slate-600">
                  <p><span class="text-slate-400">Titular:</span> {{ provider.userName }}</p>
                  <p><span class="text-slate-400">Entidad:</span> {{ provider.businessName }}</p>
                  <p><span class="text-slate-400">Identificación:</span> {{ provider.ruc }}</p>
                </div>
                <div class="pt-2 flex items-center justify-between text-[10px] text-teal-600 font-semibold">
                  <span>✓ Documento digital verificado</span>
                  <span class="font-mono">Válido 2026-2030</span>
                </div>
              </div>
            </template>
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              @click="isDocPreviewOpen = false"
              class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
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
import { useOrganizationApi } from "@/api/modules/organization/organization/useOrganizationApi";
import { useVerificationRequestApi } from "@/api/modules/organization/verification_request/useVerificationRequestApi";
import { useToastStore } from "@/stores/ui";

export interface ProviderDetailDoc {
  id: string;
  name: string;
  filename: string;
  filesize: string;
  type: "pdf" | "image";
  status: "Válido" | "Inválido";
}

export interface ProviderHistoryEvent {
  date: string;
  title: string;
  description: string;
}

export interface AdminProviderDetailData {
  id: string;
  userName: string;
  userEmail: string;
  userInitials: string;
  avatarBg: string;
  userPhone: string;
  userNationalId: string;
  businessName: string;
  ruc: string;
  businessType: string;
  businessEmail: string;
  businessPhone: string;
  description: string;
  address: string;
  logoFilename: string;
  logoFilesize: string;
  registeredAt: string;
  registeredDate: string;
  status: "Pendiente" | "Aprobado" | "Rechazado" | "Borrador" | "Revocado";
  role: string;
  documents: ProviderDetailDoc[];
  history: ProviderHistoryEvent[];
}

const route = useRoute();
const router = useRouter();
const organizationApi = useOrganizationApi();
const verificationApi = useVerificationRequestApi();
const toastStore = useToastStore();

const providerId = computed(() => (route.params.id as string) || "");
const realVerificationRequestId = ref<string | null>(null);

const isLoading = ref(true);
const errorMessage = ref<string | null>(null);
const provider = ref<AdminProviderDetailData | null>(null);

const activeTab = ref<"info" | "docs" | "history">("info");

// --- Modal States ---
const isApproveModalOpen = ref(false);
const isRejectModalOpen = ref(false);
const isDocPreviewOpen = ref(false);
const isSubmitting = ref(false);

// Document Preview state
const previewDoc = ref<ProviderDetailDoc | null>(null);

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

async function loadProvider() {
  const targetId = providerId.value;
  if (!targetId) {
    isLoading.value = false;
    errorMessage.value = "ID de proveedor no especificado.";
    return;
  }

  isLoading.value = true;
  errorMessage.value = null;

  try {
    let reqAggregate: any = null;
    let orgDetails: any = null;

    // 1. Try checking if targetId is directly a verification request ID
    try {
      reqAggregate = await verificationApi.getVerificationRequest(targetId);
      realVerificationRequestId.value = targetId;
      if (reqAggregate?.request?.organization_id) {
        orgDetails = await organizationApi.getOrganizationDetails(reqAggregate.request.organization_id);
      }
    } catch {
      // 2. targetId might be an organization ID
      try {
        orgDetails = await organizationApi.getOrganizationDetails(targetId);
        const batch = await verificationApi.getVerificationRequestsBatch({ provider_ids: [targetId] });
        if (batch && batch[targetId]) {
          realVerificationRequestId.value = batch[targetId].id;
          reqAggregate = await verificationApi.getVerificationRequest(batch[targetId].id);
        }
      } catch (err: any) {
        console.error("Could not fetch organization details:", err);
      }
    }

    if (!orgDetails) {
      errorMessage.value = "No se encontró la organización o proveedor solicitado.";
      provider.value = null;
      return;
    }

    const verif = reqAggregate?.request;
    const statusMap: Record<string, "Pendiente" | "Aprobado" | "Rechazado" | "Borrador" | "Revocado"> = {
      pending: "Pendiente",
      approved: "Aprobado",
      rejected: "Rechazado",
      draft: "Borrador",
      revoked: "Revocado",
    };

    const resolvedStatus = verif?.status
      ? statusMap[verif.status] || "Pendiente"
      : statusMap[orgDetails.status] || "Borrador";

    const typeMap: Record<string, string> = {
      wholesaler: "Comercio al por mayor",
      manufacturer: "Fabricante",
      distributor: "Distribuidor",
      retailer: "Pequeño comercio",
      service: "Servicio",
    };

    const initials = orgDetails.company_name
      .split(" ")
      .filter(Boolean)
      .map((w: string) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "PR";

    const docs: ProviderDetailDoc[] = reqAggregate?.documents
      ? reqAggregate.documents.map((d: any) => ({
          id: d.blob_id,
          name: d.document_label || "Documento Legal",
          filename: `${(d.document_label || "documento").toLowerCase().replace(/[^a-z0-9]/g, "_")}.pdf`,
          filesize: "Adjunto",
          type: (d.document_label || "").toLowerCase().includes("logo") ? ("image" as const) : ("pdf" as const),
          status: "Válido" as const,
        }))
      : [];

    const historyItems: ProviderHistoryEvent[] = [];
    if (verif?.submitted_at) {
      historyItems.push({
        date: new Date(verif.submitted_at).toLocaleDateString("es-NI", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        title: "Solicitud enviada a revisión",
        description: "El importador adjuntó sus documentos legales para verificación.",
      });
    }
    if (verif?.reviewed_at) {
      historyItems.push({
        date: new Date(verif.reviewed_at).toLocaleDateString("es-NI", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        title: verif.status === "approved" ? "Cuenta verificada y aprobada" : "Solicitud rechazada",
        description: verif.reviewer_notes || "Revisión procesada por la administración de Mercanto.",
      });
    }

    provider.value = {
      id: orgDetails.id,
      userName: orgDetails.company_name,
      userEmail: `contacto@${orgDetails.company_name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
      userInitials: initials,
      avatarBg: "bg-[#023859]",
      userPhone: orgDetails.phone_number || "No registrado",
      userNationalId: "001-000000-0000A",
      businessName: orgDetails.company_name,
      ruc: orgDetails.tax_id,
      businessType: typeMap[orgDetails.kind] || "Comercio al por mayor",
      businessEmail: `contacto@${orgDetails.company_name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
      businessPhone: orgDetails.phone_number || "No registrado",
      description: orgDetails.company_description || "Sin descripción proporcionada",
      address: orgDetails.address || "Nicaragua",
      logoFilename: orgDetails.logo_blob_id ? "logo_empresa.jpg" : "Sin logo",
      logoFilesize: "300 KB",
      registeredAt: verif?.submitted_at
        ? new Date(verif.submitted_at).toLocaleDateString("es-NI", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : orgDetails.created_at
        ? new Date(orgDetails.created_at).toLocaleDateString("es-NI", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—",
      registeredDate: verif?.submitted_at || orgDetails.created_at || new Date().toISOString(),
      status: resolvedStatus,
      role: "Proveedor",
      documents: docs,
      history: historyItems,
    };
  } catch (err: any) {
    console.error("Error loading provider:", err);
    errorMessage.value = err?.message || "Ocurrió un error al cargar la información del proveedor.";
  } finally {
    isLoading.value = false;
  }
}

// --- Handlers ---
function goBack() {
  router.push({ name: "admin-providers" });
}

function openDocPreview(doc: ProviderDetailDoc) {
  previewDoc.value = doc;
  isDocPreviewOpen.value = true;
}

async function handleConfirmApprove() {
  if (!provider.value) return;

  if (!realVerificationRequestId.value) {
    toastStore.addToast({
      title: "Sin solicitud activa",
      message: "Esta organización no cuenta con una solicitud de verificación activa pendiente.",
      variant: "warning",
    });
    return;
  }

  isSubmitting.value = true;
  try {
    await verificationApi.approveVerificationRequest(realVerificationRequestId.value, {
      reviewer_notes: "Aprobado por el administrador",
    });

    provider.value.status = "Aprobado";
    provider.value.history.unshift({
      date: new Date().toLocaleDateString("es-NI", { day: "2-digit", month: "short", year: "numeric" }),
      title: "Cuenta verificada y aprobada",
      description: "El administrador ha aprobado la verificación del proveedor.",
    });

    toastStore.addToast({
      title: "Cuenta aprobada",
      message: "El proveedor ha sido verificado con éxito y ya puede publicar su catálogo.",
      variant: "success",
    });

    isApproveModalOpen.value = false;
  } catch (err: any) {
    console.error("Error approving verification request:", err);
    toastStore.addToast({
      title: "Error al aprobar",
      message: err?.message || "No se pudo procesar la aprobación en el servidor.",
      variant: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
}

async function handleConfirmReject() {
  if (!provider.value) return;

  if (!realVerificationRequestId.value) {
    toastStore.addToast({
      title: "Sin solicitud activa",
      message: "Esta organización no cuenta con una solicitud de verificación activa para rechazar.",
      variant: "warning",
    });
    return;
  }

  isSubmitting.value = true;
  try {
    const combinedNotes = rejectionNotes.value.trim()
      ? `[${rejectionReason.value}] ${rejectionNotes.value.trim()}`
      : `[${rejectionReason.value}]`;

    await verificationApi.rejectVerificationRequest(realVerificationRequestId.value, {
      reviewer_notes: combinedNotes,
    });

    provider.value.status = "Rechazado";
    provider.value.history.unshift({
      date: new Date().toLocaleDateString("es-NI", { day: "2-digit", month: "short", year: "numeric" }),
      title: "Solicitud rechazada",
      description: `${rejectionReason.value}: ${rejectionNotes.value || "Sin notas adicionales."}`,
    });

    toastStore.addToast({
      title: "Cuenta rechazada",
      message: "Se ha registrado el rechazo de la solicitud y notificado al proveedor.",
      variant: "error",
    });

    isRejectModalOpen.value = false;
  } catch (err: any) {
    console.error("Error rejecting verification request:", err);
    toastStore.addToast({
      title: "Error al rechazar",
      message: err?.message || "No se pudo rechazar la solicitud en el backend.",
      variant: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(() => {
  loadProvider();
});
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
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

    <!-- SKELETON STATE -->
    <template v-if="isLoading">
      <div class="space-y-6 animate-pulse">
        <div class="space-y-2">
          <div class="h-7 w-52 bg-slate-200 rounded-lg"></div>
          <div class="h-4 w-96 bg-slate-100 rounded"></div>
        </div>

        <!-- Top Card Skeleton -->
        <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="h-12 w-12 rounded-full bg-slate-200"></div>
            <div class="space-y-2">
              <div class="h-5 w-48 bg-slate-200 rounded"></div>
              <div class="h-3 w-64 bg-slate-100 rounded"></div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="h-9 w-24 bg-slate-200 rounded-xl"></div>
            <div class="h-9 w-24 bg-slate-200 rounded-xl"></div>
          </div>
        </div>

        <!-- Tabs Skeleton -->
        <div class="flex gap-4 border-b border-slate-200 pb-3">
          <div class="h-5 w-24 bg-slate-200 rounded"></div>
          <div class="h-5 w-24 bg-slate-200 rounded"></div>
          <div class="h-5 w-24 bg-slate-200 rounded"></div>
        </div>

        <!-- Grid Skeleton -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="rounded-2xl border border-slate-100 bg-white p-6 space-y-4">
            <div class="h-5 w-36 bg-slate-200 rounded"></div>
            <div class="space-y-3 pt-2">
              <div class="h-4 w-full bg-slate-100 rounded"></div>
              <div class="h-4 w-5/6 bg-slate-100 rounded"></div>
              <div class="h-4 w-4/6 bg-slate-100 rounded"></div>
            </div>
          </div>
          <div class="rounded-2xl border border-slate-100 bg-white p-6 space-y-4">
            <div class="h-5 w-36 bg-slate-200 rounded"></div>
            <div class="space-y-3 pt-2">
              <div class="h-4 w-full bg-slate-100 rounded"></div>
              <div class="h-4 w-5/6 bg-slate-100 rounded"></div>
              <div class="h-4 w-4/6 bg-slate-100 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ERROR / NOT FOUND STATE -->
    <template v-else-if="!provider || errorMessage">
      <div class="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-xs">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 mb-3">
          <i class="fa-solid fa-triangle-exclamation text-2xl"></i>
        </div>
        <h2 class="text-base font-bold text-[#023859]">Proveedor no encontrado</h2>
        <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          {{ errorMessage || "No se ha podido localizar la información de este proveedor o solicitud de verificación." }}
        </p>
        <button
          type="button"
          @click="goBack"
          class="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#00a896] px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#0284c7] transition-all cursor-pointer"
        >
          <i class="fa-solid fa-arrow-left text-xs"></i>
          <span>Volver al listado de proveedores</span>
        </button>
      </div>
    </template>

    <!-- LOADED PROVIDER DETAIL VIEW -->
    <template v-else>
      <!-- Header Section -->
      <div>
        <h1 class="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#023859]">
          Detalle del usuario
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 mt-1">
          Revisa la información del importador y sus documentos para verificar o gestionar su cuenta.
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

        <!-- Action Buttons (Aprobar / Rechazar) -->
        <div class="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            @click="isRejectModalOpen = true"
            :disabled="provider.status === 'Rechazado'"
            class="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 shadow-2xs transition-all cursor-pointer"
          >
            <i class="fa-solid fa-xmark text-xs"></i>
            <span>Rechazar</span>
          </button>

          <button
            type="button"
            @click="isApproveModalOpen = true"
            :disabled="provider.status === 'Aprobado'"
            class="inline-flex items-center gap-1.5 rounded-xl bg-[#00a896] px-4 py-2 text-xs font-bold text-white hover:bg-[#0284c7] disabled:opacity-50 shadow-2xs transition-all cursor-pointer"
          >
            <i class="fa-solid fa-check text-xs"></i>
            <span>Aprobar</span>
          </button>
        </div>
      </div>

      <!-- Detail Tabs (Información, Documentos, Historial) -->
      <TabsRoot v-model="activeTab" class="space-y-6">
        <!-- Tabs Header -->
        <TabsList class="flex items-center gap-8 border-b border-slate-200">
          <TabsTrigger
            value="info"
            class="pb-3 text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 data-[state=active]:text-[#00a896] data-[state=active]:border-b-2 data-[state=active]:border-[#00a896] text-slate-500 hover:text-slate-700"
          >
            Información
          </TabsTrigger>

          <TabsTrigger
            value="docs"
            class="pb-3 text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 data-[state=active]:text-[#00a896] data-[state=active]:border-b-2 data-[state=active]:border-[#00a896] text-slate-500 hover:text-slate-700"
          >
            <span>Documentos</span>
            <span class="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600">
              {{ provider.documents.length }}
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="history"
            class="pb-3 text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 data-[state=active]:text-[#00a896] data-[state=active]:border-b-2 data-[state=active]:border-[#00a896] text-slate-500 hover:text-slate-700"
          >
            Historial
          </TabsTrigger>
        </TabsList>

        <!-- TAB 1: INFORMACIÓN -->
        <TabsContent value="info" class="space-y-6 focus:outline-none">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Col 1: Datos Personales / Representante -->
            <div class="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <h3 class="font-bold text-[#023859] text-sm">
                Datos de la cuenta
              </h3>

              <div class="space-y-3.5 text-xs divide-y divide-slate-100">
                <div class="flex justify-between py-1.5">
                  <span class="text-slate-400">Razón social</span>
                  <span class="font-bold text-slate-700">{{ provider.userName }}</span>
                </div>

                <div class="flex justify-between pt-3">
                  <span class="text-slate-400">Correo electrónico</span>
                  <span class="font-semibold text-slate-700">{{ provider.userEmail }}</span>
                </div>

                <div class="flex justify-between pt-3">
                  <span class="text-slate-400">Teléfono</span>
                  <span class="font-semibold text-slate-700">{{ provider.userPhone }}</span>
                </div>

                <div class="flex justify-between pt-3">
                  <span class="text-slate-400">Rol</span>
                  <span class="font-semibold text-slate-700">{{ provider.role }}</span>
                </div>

                <div class="flex justify-between pt-3">
                  <span class="text-slate-400">Fecha de registro</span>
                  <span class="font-semibold text-slate-700">{{ provider.registeredAt }}</span>
                </div>
              </div>
            </div>

            <!-- Col 2: Datos del Negocio -->
            <div class="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <h3 class="font-bold text-[#023859] text-sm">
                Datos del negocio
              </h3>

              <div class="space-y-3.5 text-xs divide-y divide-slate-100">
                <div class="flex justify-between py-1.5">
                  <span class="text-slate-400">Nombre comercial</span>
                  <span class="font-bold text-slate-700">{{ provider.businessName }}</span>
                </div>

                <div class="flex justify-between pt-3">
                  <span class="text-slate-400">RUC</span>
                  <span class="font-mono font-bold text-slate-700">{{ provider.ruc }}</span>
                </div>

                <div class="flex justify-between pt-3">
                  <span class="text-slate-400">Tipo de negocio</span>
                  <span class="font-semibold text-slate-700">{{ provider.businessType }}</span>
                </div>

                <div class="flex justify-between pt-3">
                  <span class="text-slate-400">Dirección</span>
                  <span class="font-semibold text-slate-700">{{ provider.address }}</span>
                </div>

                <div class="flex justify-between pt-3">
                  <span class="text-slate-400">Descripción</span>
                  <span class="font-medium text-slate-600 max-w-[240px] text-right truncate">
                    {{ provider.description }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <!-- TAB 2: DOCUMENTOS -->
        <TabsContent value="docs" class="space-y-6 focus:outline-none">
          <div class="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <h3 class="font-bold text-[#023859] text-sm">
              Documentos adjuntos para verificación
            </h3>

            <div v-if="provider.documents.length === 0" class="py-8 text-center text-slate-400">
              <i class="fa-regular fa-folder-open text-2xl mb-2 text-slate-300"></i>
              <p class="text-xs">No se han adjuntado documentos para esta solicitud.</p>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="doc in provider.documents"
                :key="doc.id"
                class="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#00a896]">
                    <i :class="doc.type === 'pdf' ? 'fa-solid fa-file-pdf' : 'fa-solid fa-file-image'" class="text-lg"></i>
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-bold text-slate-800 truncate">{{ doc.name }}</p>
                    <p class="text-[11px] text-slate-400">{{ doc.filename }} · {{ doc.filesize }}</p>
                  </div>
                </div>

                <button
                  type="button"
                  @click="openDocPreview(doc)"
                  class="ml-3 shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Ver
                </button>
              </div>
            </div>
          </div>
        </TabsContent>

        <!-- TAB 3: HISTORIAL -->
        <TabsContent value="history" class="space-y-6 focus:outline-none">
          <div class="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-xs space-y-6">
            <h3 class="font-bold text-[#023859] text-sm">
              Línea de tiempo de la solicitud
            </h3>

            <div v-if="provider.history.length === 0" class="py-6 text-center text-slate-400 text-xs">
              Sin eventos registrados.
            </div>

            <div v-else class="space-y-6 relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              <div
                v-for="(hist, idx) in provider.history"
                :key="idx"
                class="relative"
              >
                <span class="absolute -left-6 top-1.5 h-2.5 w-2.5 rounded-full bg-[#00a896] ring-4 ring-teal-50"></span>
                <div>
                  <p class="text-[11px] font-semibold text-slate-400">{{ hist.date }}</p>
                  <p class="text-xs font-bold text-slate-800 mt-0.5">{{ hist.title }}</p>
                  <p class="text-xs text-slate-500 mt-0.5">{{ hist.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </TabsRoot>
    </template>

    <!-- MODAL 1: APROBAR PROVEEDOR (Screenshot 4) -->
    <DialogRoot v-model:open="isApproveModalOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity" />
        <DialogContent
          class="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl focus:outline-none space-y-4"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-[#00a896]">
                <i class="fa-solid fa-circle-check text-lg"></i>
              </div>
              <div>
                <DialogTitle class="text-base font-bold text-[#023859]">
                  Aprobar verificación
                </DialogTitle>
                <p class="text-xs text-slate-500">
                  Confirmación de verificación de proveedor
                </p>
              </div>
            </div>
            <DialogClose class="text-slate-400 hover:text-slate-600 cursor-pointer">
              <i class="fa-solid fa-xmark text-sm"></i>
            </DialogClose>
          </div>

          <div v-if="provider" class="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1.5 text-xs">
            <p class="font-bold text-slate-800">{{ provider.userName }}</p>
            <p class="text-slate-500">RUC: <span class="font-mono">{{ provider.ruc }}</span></p>
            <p class="text-slate-500">Tipo: {{ provider.businessType }}</p>
          </div>

          <p class="text-xs text-slate-500 leading-relaxed">
            Al aprobar esta solicitud, la cuenta pasará a estado <strong>Verificado</strong> y el proveedor podrá publicar productos y recibir cotizaciones en la plataforma.
          </p>

          <div class="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              @click="isApproveModalOpen = false"
              class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              :disabled="isSubmitting"
              @click="handleConfirmApprove"
              class="inline-flex items-center gap-2 rounded-xl bg-[#00a896] px-4 py-2 text-xs font-bold text-white hover:bg-[#0284c7] disabled:opacity-50 shadow-2xs cursor-pointer"
            >
              <i v-if="isSubmitting" class="fa-solid fa-spinner fa-spin text-xs"></i>
              <span>Confirmar y Aprobar</span>
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <!-- MODAL 2: RECHAZAR PROVEEDOR (Screenshot 3) -->
    <DialogRoot v-model:open="isRejectModalOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity" />
        <DialogContent
          class="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl focus:outline-none space-y-4"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <i class="fa-solid fa-circle-xmark text-lg"></i>
              </div>
              <div>
                <DialogTitle class="text-base font-bold text-[#023859]">
                  Rechazar verificación
                </DialogTitle>
                <p class="text-xs text-slate-500">
                  Indica el motivo del rechazo
                </p>
              </div>
            </div>
            <DialogClose class="text-slate-400 hover:text-slate-600 cursor-pointer">
              <i class="fa-solid fa-xmark text-sm"></i>
            </DialogClose>
          </div>

          <!-- Reason Selector -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-700">Motivo del rechazo</label>
            <div class="space-y-2">
              <label
                v-for="opt in REJECTION_OPTIONS"
                :key="opt"
                class="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer"
              >
                <input
                  type="radio"
                  v-model="rejectionReason"
                  :value="opt"
                  class="text-[#00a896] focus:ring-[#00a896]"
                />
                <span>{{ opt }}</span>
              </label>
            </div>
          </div>

          <!-- Notes Textarea -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700">Detalles adicionales</label>
            <textarea
              v-model="rejectionNotes"
              rows="3"
              maxlength="500"
              placeholder="Explica detalladamente qué documentos o datos deben corregirse..."
              class="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-700 placeholder-slate-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20"
            ></textarea>
            <div class="text-right text-[10px] text-slate-400">
              {{ rejectionNotes.length }}/500 caracteres
            </div>
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              @click="isRejectModalOpen = false"
              class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              :disabled="isSubmitting"
              @click="handleConfirmReject"
              class="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 shadow-2xs cursor-pointer"
            >
              <i v-if="isSubmitting" class="fa-solid fa-spinner fa-spin text-xs"></i>
              <span>Confirmar Rechazo</span>
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <!-- MODAL 3: PREVIEW DE DOCUMENTOS -->
    <DialogRoot v-model:open="isDocPreviewOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity" />
        <DialogContent
          class="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl focus:outline-none space-y-4"
        >
          <div class="flex items-center justify-between">
            <DialogTitle class="text-base font-bold text-[#023859]">
              {{ previewDoc?.name || 'Vista previa del documento' }}
            </DialogTitle>
            <DialogClose class="text-slate-400 hover:text-slate-600 cursor-pointer">
              <i class="fa-solid fa-xmark text-sm"></i>
            </DialogClose>
          </div>

          <div class="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center min-h-[260px] flex flex-col items-center justify-center">
            <i :class="previewDoc?.type === 'pdf' ? 'fa-solid fa-file-pdf text-red-500' : 'fa-solid fa-file-image text-teal-500'" class="text-5xl mb-3"></i>
            <p class="font-bold text-slate-800 text-sm">{{ previewDoc?.filename }}</p>
            <p class="text-xs text-slate-400 mt-0.5">{{ previewDoc?.filesize }}</p>
            <p class="text-xs text-slate-500 mt-3 max-w-sm">
              Visor de documento adjunto en la solicitud de verificación.
            </p>
          </div>

          <div class="flex justify-end pt-2">
            <DialogClose class="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer">
              Cerrar
            </DialogClose>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>

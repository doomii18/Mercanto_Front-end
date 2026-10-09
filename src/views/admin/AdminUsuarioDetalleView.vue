<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsContent,
  RadioGroupRoot,
  RadioGroupItem,
  RadioGroupIndicator,
} from "reka-ui";
import { useIdentityApi } from "@/api/modules/identity/auth/useIdentityApi";
import { useVerificationRequestApi } from "@/api/modules/organization/verification_request/useVerificationRequestApi";
import { useVerificationDocumentApi } from "@/api/modules/organization/verification_request_document/useVerificationDocumentApi";
import { useOrganizationApi } from "@/api/modules/organization/organization/useOrganizationApi";
import { useUserContextStore } from "@/stores/auth/userContextStore";
import { useToastStore } from "@/stores/ui";
import ProfileAvatar from "@/components/profile/ProfileAvatar.vue";
import NationalIdDisplay from "@/components/common/NationalIdDisplay.vue";
import TaxIdDisplay from "@/components/common/TaxIdDisplay.vue";
import PhoneDisplay from "@/components/common/PhoneDisplay.vue";

const route = useRoute();
const router = useRouter();
const identityApi = useIdentityApi();
const verificationApi = useVerificationRequestApi();
const verificationDocumentApi = useVerificationDocumentApi();
const organizationApi = useOrganizationApi();
const contextStore = useUserContextStore();
const toastStore = useToastStore();

const isAdmin = computed(() => contextStore.isAdmin);

// --- User & State Data ---
const userId = computed(() => (route.params.id as string) || "");
const activeTab = ref<"info" | "docs" | "history">("info");
const isLoading = ref(false);
const currentVerificationRequestId = ref<string | null>(null);

// Document preview state
const docBlobUrl = ref<string | null>(null);
const isLoadingDoc = ref(false);

interface DocumentItem {
  id: string;
  name: string;
  filename: string;
  filesize: string;
  type: "pdf" | "image";
  status: string;
  blobId?: string;
}

// Main user detail model
const user = ref({
  id: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  national_id: "",
  avatar_blob_id: null as string | null,
  role: "Proveedor",
  status: "Pendiente" as "Pendiente" | "Aprobado" | "Rechazado",
  registered_at: "",
  initials: "PR",
  avatar_bg: "bg-[#023859]",

  // Business info
  business_name: "",
  ruc: "",
  business_type: "Comercio al por mayor",
  business_email: "",
  business_phone: "",
  description: "",
  address: "",
  logo_filename: "",
  logo_filesize: "",

  // Verification documents
  documents: [] as DocumentItem[],

  // History timeline
  history: [] as Array<{ date: string; title: string; description: string }>,
});

// --- Modal States ---
const isApproveModalOpen = ref(false);
const isRejectModalOpen = ref(false);
const isDocPreviewOpen = ref(false);
const previewDoc = ref<{ name: string; filename: string; blobId?: string; type?: "pdf" | "image" } | null>(null);

// Rejection Form
const rejectionReason = ref("Documentación inválida o incompleta");
const rejectionNotes = ref("");
const isSubmitting = ref(false);

const REJECTION_OPTIONS = [
  "Documentación inválida o incompleta",
  "La información no coincide",
  "El RUC no es válido",
  "El tipo de negocio no corresponde",
  "Otro motivo",
];

function formatDateDisplay(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("es-NI", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

// --- Load Data (Real API Integration) ---
async function loadUserData() {
  const targetId = userId.value;
  if (!targetId) return;

  isLoading.value = true;
  try {
    let verifAggregate: any = null;
    try {
      verifAggregate = await verificationApi.getVerificationRequest(targetId);
    } catch {
      // targetId may be an account ID or organization ID
    }

    if (verifAggregate && verifAggregate.request) {
      const req = verifAggregate.request;
      currentVerificationRequestId.value = req.id;
      user.value.id = req.id;
      user.value.status = req.status === "approved" ? "Aprobado" : req.status === "rejected" ? "Rechazado" : "Pendiente";
      user.value.registered_at = formatDateDisplay(req.submitted_at);

      // 1. Load Organization Details
      try {
        const org = await organizationApi.getOrganizationDetails(req.organization_id);
        if (org) {
          user.value.business_name = org.company_name;
          user.value.ruc = org.tax_id;
          user.value.business_type = org.kind === "wholesaler" ? "Comercio al por mayor" : org.kind === "manufacturer" ? "Fabricante / Productor" : "Distribuidor";
          user.value.role = org.kind === "wholesaler" ? "Mayorista" : "Proveedor";
          user.value.business_phone = org.phone_number || "";
          user.value.description = org.company_description || "";
          user.value.address = org.location ? `Coords: ${org.location.latitude.toFixed(4)}, ${org.location.longitude.toFixed(4)}` : "Nicaragua";
          user.value.logo_filename = org.logo_blob_id ? "logo_organizacion.jpg" : "Sin logo";
        }
      } catch (orgErr) {
        console.warn("Could not fetch organization details:", orgErr);
      }

      // 2. Load Submitter Account if available
      if (req.submitted_by) {
        try {
          const account = await identityApi.getAccount(req.submitted_by) as any;
          if (account) {
            user.value.first_name = account.first_name || "";
            user.value.last_name = account.last_name || "";
            user.value.email = account.email;
            user.value.business_email = account.email;
            user.value.national_id = account.national_id || "";
            user.value.phone = account.phone_number || user.value.business_phone;
            user.value.avatar_blob_id = account.avatar_blob_id || null;
            user.value.initials = `${(user.value.first_name[0] || user.value.business_name[0] || "P")}${(user.value.last_name[0] || "R")}`.toUpperCase();
          }
        } catch (accErr) {
          console.warn("Could not fetch submitter account:", accErr);
        }
      } else {
        user.value.initials = `${(user.value.business_name[0] || "P")}${(user.value.business_name[1] || "R")}`.toUpperCase();
      }

      // 3. Map Real Verification Documents
      if (verifAggregate.documents && verifAggregate.documents.length > 0) {
        user.value.documents = verifAggregate.documents.map((d: any, idx: number) => {
          const label = d.document_label || `Documento Legal ${idx + 1}`;
          const isPdf = !label.toLowerCase().includes("logo") && !label.toLowerCase().includes("foto") && !label.toLowerCase().includes("imagen");
          return {
            id: d.blob_id,
            name: label,
            filename: `${label.toLowerCase().replace(/[^a-z0-9_-]/g, "_")}${isPdf ? ".pdf" : ".jpg"}`,
            filesize: "Adjunto",
            type: isPdf ? ("pdf" as const) : ("image" as const),
            status: "Válido",
            blobId: d.blob_id,
          };
        });
      } else {
        user.value.documents = [];
      }

      // 4. Build Real History Timeline
      const hist: Array<{ date: string; title: string; description: string }> = [];
      if (req.reviewed_at) {
        hist.push({
          date: formatDateDisplay(req.reviewed_at),
          title: req.status === "approved" ? "Cuenta verificada y aprobada" : "Cuenta rechazada",
          description: req.reviewer_notes || "Revisión completada por el administrador.",
        });
      }
      hist.push({
        date: formatDateDisplay(req.submitted_at),
        title: "Solicitud enviada a revisión",
        description: "El comercio adjuntó sus documentos legales y solicitó validación administrativa.",
      });
      user.value.history = hist;
      return;
    }

    // Fallback: If targetId was an account ID directly
    const account = await identityApi.getAccount(targetId) as any;
    if (account) {
      user.value.id = account.id;
      user.value.first_name = account.first_name || "Usuario";
      user.value.last_name = account.last_name || "";
      user.value.email = account.email;
      user.value.business_email = account.email;
      user.value.national_id = account.national_id || "";
      user.value.phone = account.phone_number || "";
      user.value.avatar_blob_id = account.avatar_blob_id || null;
      user.value.initials = `${(user.value.first_name[0] || "U")}${(user.value.last_name[0] || "S")}`.toUpperCase();

      // Check if user has an associated organization with pending verification
      try {
        const orgs = await organizationApi.getAllOrganizations();
        for (const org of orgs.data) {
          const verifs = await verificationApi.getOrganizationVerificationRequests(org.id);
          if (verifs.data.length > 0) {
            const req = verifs.data[0];
            currentVerificationRequestId.value = req.id;
            user.value.business_name = org.company_name;
            user.value.ruc = org.tax_id;
            user.value.address = org.location ? `Coords: ${org.location.latitude.toFixed(4)}, ${org.location.longitude.toFixed(4)}` : "Nicaragua";
            user.value.status = req.status === "approved" ? "Aprobado" : req.status === "rejected" ? "Rechazado" : "Pendiente";
            break;
          }
        }
      } catch (e) {
        console.warn("Could not find linked organization verifications:", e);
      }
    }
  } catch (err) {
    console.warn("Could not load user data:", err);
  } finally {
    isLoading.value = false;
  }
}

// --- Action Handlers ---
async function handleConfirmApprove() {
  if (!currentVerificationRequestId.value) {
    toastStore.addToast({
      title: "No se puede aprobar",
      message: "No se encontró una solicitud de verificación activa asociada.",
      variant: "error",
    });
    return;
  }

  isSubmitting.value = true;
  try {
    await verificationApi.approveVerificationRequest(currentVerificationRequestId.value, {
      reviewer_notes: "Aprobado por el administrador",
    });

    user.value.status = "Aprobado";
    user.value.history.unshift({
      date: new Date().toLocaleString("es-NI", { dateStyle: "medium", timeStyle: "short" }),
      title: "Cuenta verificada y aprobada",
      description: "El administrador aprobó la solicitud de verificación.",
    });

    toastStore.addToast({
      title: "Cuenta aprobada",
      message: `La cuenta de ${user.value.business_name || user.value.email} ha sido verificada con éxito.`,
      variant: "success",
    });

    isApproveModalOpen.value = false;
  } catch (err: any) {
    console.error("Error approving verification request:", err);
    toastStore.addToast({
      title: "Error al aprobar",
      message: err?.message || "No se pudo aprobar la solicitud de verificación.",
      variant: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
}

async function handleConfirmReject() {
  if (!currentVerificationRequestId.value) {
    toastStore.addToast({
      title: "No se puede rechazar",
      message: "No se encontró una solicitud de verificación activa asociada.",
      variant: "error",
    });
    return;
  }

  isSubmitting.value = true;
  try {
    const fullNotes = `${rejectionReason.value}: ${rejectionNotes.value}`.trim();
    await verificationApi.rejectVerificationRequest(currentVerificationRequestId.value, {
      reviewer_notes: fullNotes,
    });

    user.value.status = "Rechazado";
    user.value.history.unshift({
      date: new Date().toLocaleString("es-NI", { dateStyle: "medium", timeStyle: "short" }),
      title: `Cuenta rechazada (${rejectionReason.value})`,
      description: rejectionNotes.value || "No se especificaron detalles adicionales.",
    });

    toastStore.addToast({
      title: "Cuenta rechazada",
      message: `Se ha registrado el rechazo de la solicitud.`,
      variant: "error",
    });

    isRejectModalOpen.value = false;
  } catch (err: any) {
    console.error("Error rejecting verification request:", err);
    toastStore.addToast({
      title: "Error al rechazar",
      message: err?.message || "No se pudo rechazar la solicitud de verificación.",
      variant: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
}

function openDocPreview(docName: string, filename: string, blobId?: string, type?: "pdf" | "image") {
  previewDoc.value = { name: docName, filename, blobId, type };
  docBlobUrl.value = null;
  isDocPreviewOpen.value = true;
  if (blobId) {
    isLoadingDoc.value = true;
    verificationDocumentApi.getVerificationDocumentBlob(blobId)
      .then((blob) => {
        docBlobUrl.value = URL.createObjectURL(blob);
      })
      .catch((err) => {
        console.warn("Could not fetch verification doc blob:", err);
      })
      .finally(() => {
        isLoadingDoc.value = false;
      });
  }
}

function goBack() {
  router.push({ name: "admin-users" });
}

onMounted(() => {
  loadUserData();
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
        <span>Volver a usuarios</span>
      </button>
    </div>

    <!-- Header Section -->
    <div>
      <h1 class="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#023859]">
        Detalle del usuario
      </h1>
      <p class="text-xs sm:text-sm text-slate-500 mt-1">
        Revisa la información del importador y sus documentos para aprobar o rechazar su cuenta.
      </p>
    </div>

    <!-- Top User Card -->
    <div class="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-3.5">
        <!-- Avatar -->
        <div
          v-if="user.avatar_blob_id"
          class="h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-slate-100"
        >
          <ProfileAvatar :blob-id="user.avatar_blob_id" :alt="user.first_name" />
        </div>
        <div
          v-else
          :class="[
            'h-12 w-12 shrink-0 flex items-center justify-center rounded-full text-white font-bold text-sm shadow-2xs',
            user.avatar_bg
          ]"
        >
          {{ user.initials }}
        </div>

        <!-- Name & Status -->
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-base sm:text-lg font-bold text-[#023859]">
              {{ user.first_name }} {{ user.last_name }}
            </h2>
            <span
              :class="[
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                user.status === 'Pendiente'
                  ? 'bg-orange-50 text-[#ea580c] border border-orange-200/60'
                  : user.status === 'Aprobado'
                  ? 'bg-teal-50 text-[#00a896] border border-teal-200/60'
                  : 'bg-red-50 text-red-600 border border-red-200/60'
              ]"
            >
              <span
                :class="[
                  'h-1.5 w-1.5 rounded-full',
                  user.status === 'Pendiente'
                    ? 'bg-[#ea580c]'
                    : user.status === 'Aprobado'
                    ? 'bg-[#00a896]'
                    : 'bg-red-500'
                ]"
              ></span>
              {{ user.status }}
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">
            {{ user.role }} - Registrado el {{ user.registered_at }}
          </p>
        </div>
      </div>

      <!-- Right Contact Info -->
      <div class="space-y-1 text-xs text-slate-500">
        <div class="flex items-center gap-2">
          <i class="fa-regular fa-envelope text-slate-400 text-xs w-4"></i>
          <span>{{ user.email }}</span>
        </div>
        <div class="flex items-center gap-2 font-mono">
          <i class="fa-regular fa-id-card text-slate-400 text-xs w-4"></i>
          <span><TaxIdDisplay :value="user.ruc" /></span>
        </div>
      </div>
    </div>

    <!-- Tabs Container (Reka UI) -->
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
          Documentos ({{ user.documents.length }})
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
            <!-- Card: Información del negocio -->
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
                  <p class="font-bold text-slate-800 text-sm mt-0.5">{{ user.business_name }}</p>
                </div>

                <div>
                  <span class="text-slate-400 block font-medium">RUC</span>
                  <p class="font-mono font-bold text-slate-800 text-sm mt-0.5"><TaxIdDisplay :value="user.ruc" /></p>
                </div>

                <div>
                  <span class="text-slate-400 block font-medium">Tipo de negocio</span>
                  <p class="font-semibold text-slate-700 mt-0.5">{{ user.business_type }}</p>
                </div>

                <div>
                  <span class="text-slate-400 block font-medium">Correo del negocio</span>
                  <p class="font-semibold text-slate-700 mt-0.5">{{ user.business_email }}</p>
                </div>

                <div>
                  <span class="text-slate-400 block font-medium">Teléfono del negocio</span>
                  <p class="font-semibold text-slate-700 mt-0.5"><PhoneDisplay :value="user.business_phone" /></p>
                </div>

                <div>
                  <span class="text-slate-400 block font-medium">Descripción</span>
                  <p class="text-slate-600 mt-0.5 leading-relaxed">{{ user.description }}</p>
                </div>

                <div>
                  <span class="text-slate-400 block font-medium">Dirección</span>
                  <p class="font-semibold text-slate-700 mt-0.5">{{ user.address }}</p>
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
                      <p class="font-semibold text-slate-800 text-xs">{{ user.logo_filename }}</p>
                      <p class="text-slate-400 text-[11px]">{{ user.logo_filesize }}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    @click="openDocPreview('Logo del negocio', user.logo_filename)"
                    class="inline-flex items-center gap-1 text-xs font-semibold text-[#00a896] hover:underline cursor-pointer"
                  >
                    <i class="fa-regular fa-eye text-xs"></i>
                    <span>Ver</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Card: Información del propietario -->
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
                  <p class="font-bold text-slate-800 text-sm mt-0.5">{{ user.first_name }} {{ user.last_name }}</p>
                </div>

                <div>
                  <span class="text-slate-400 block font-medium">Correo electrónico</span>
                  <p class="font-semibold text-slate-700 mt-0.5">{{ user.email }}</p>
                </div>

                <div>
                  <span class="text-slate-400 block font-medium">Cédula</span>
                  <p class="font-mono font-bold text-slate-800 text-sm mt-0.5">
                    <NationalIdDisplay :value="user.national_id" />
                  </p>
                </div>

                <div>
                  <span class="text-slate-400 block font-medium">Teléfono</span>
                  <p class="font-semibold text-slate-700 mt-0.5"><PhoneDisplay :value="user.phone" /></p>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column (approx 35%) -->
          <div class="lg:col-span-4 space-y-6">
            <!-- Card 1: Cuenta pendiente de verificación -->
            <div
              :class="[
                'rounded-2xl border p-4 sm:p-5 shadow-2xs space-y-2',
                user.status === 'Pendiente'
                  ? 'border-amber-200/70 bg-[#fffbeb]'
                  : user.status === 'Aprobado'
                  ? 'border-teal-200/70 bg-[#f0fdfa]'
                  : 'border-red-200/70 bg-[#fef2f2]'
              ]"
            >
              <div class="flex items-center gap-2.5">
                <i
                  :class="[
                    'text-base',
                    user.status === 'Pendiente'
                      ? 'fa-regular fa-clock text-amber-500'
                      : user.status === 'Aprobado'
                      ? 'fa-solid fa-circle-check text-[#00a896]'
                      : 'fa-solid fa-circle-xmark text-red-500'
                  ]"
                ></i>
                <h4
                  :class="[
                    'text-xs sm:text-sm font-bold',
                    user.status === 'Pendiente'
                      ? 'text-amber-900'
                      : user.status === 'Aprobado'
                      ? 'text-teal-900'
                      : 'text-red-900'
                  ]"
                >
                  {{
                    user.status === 'Pendiente'
                      ? 'Cuenta pendiente de verificación'
                      : user.status === 'Aprobado'
                      ? 'Cuenta verificada con éxito'
                      : 'Cuenta rechazada'
                  }}
                </h4>
              </div>
              <p
                :class="[
                  'text-xs leading-relaxed',
                  user.status === 'Pendiente'
                    ? 'text-amber-800/80'
                    : user.status === 'Aprobado'
                    ? 'text-teal-800/80'
                    : 'text-red-800/80'
                ]"
              >
                {{
                  user.status === 'Pendiente'
                    ? 'Revisa la información y los documentos del importador. Si todo es correcto, aprueba la cuenta para que pueda publicar productos.'
                    : user.status === 'Aprobado'
                    ? 'Este importador ya está verificado y tiene permisos activos para publicar su catálogo en Mercanto.'
                    : 'La solicitud no cumplió con los requerimientos. El usuario puede volver a registrarse corrigiendo sus documentos.'
                }}
              </p>
            </div>

            <!-- Card 2: Documentos de verificación -->
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
              <div v-if="user.documents.length === 0" class="py-4 text-center text-xs text-slate-400 italic">
                No hay documentos adjuntos en esta solicitud.
              </div>
              <div v-else class="space-y-2.5">
                <div
                  v-for="doc in user.documents.slice(0, 2)"
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
                      @click="openDocPreview(doc.name, doc.filename, doc.blobId, doc.type)"
                      class="inline-flex items-center gap-1 text-xs font-semibold text-[#00a896] hover:underline cursor-pointer"
                    >
                      <i class="fa-regular fa-eye text-xs"></i>
                      <span>Ver</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card 3: Criterios de verificación -->
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

            <!-- Bottom Action Buttons (Rechazar / Aprobar) -->
            <div v-if="isAdmin" class="flex items-center gap-3 pt-2">
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
          <div v-if="user.documents.length === 0" class="py-12 text-center text-slate-400">
            <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
              <i class="fa-regular fa-folder-open text-xl"></i>
            </div>
            <p class="text-xs font-semibold">No se encontraron documentos adjuntos para esta solicitud.</p>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="doc in user.documents"
              :key="doc.id"
              class="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
            >
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-[#0284c7]">
                    <i :class="doc.type === 'image' ? 'fa-regular fa-image text-base' : 'fa-regular fa-file-pdf text-base'"></i>
                  </div>
                  <div>
                    <h4 class="font-bold text-xs text-slate-800">{{ doc.name }}</h4>
                    <p class="text-[11px] text-slate-400">{{ doc.filesize }}</p>
                  </div>
                </div>
                <span class="rounded-full bg-teal-50 border border-teal-200/50 px-2 py-0.5 text-[10px] font-bold text-[#00a896]">
                  {{ doc.status }}
                </span>
              </div>
              <p class="font-mono text-xs text-slate-600 truncate">{{ doc.filename }}</p>
              <button
                type="button"
                @click="openDocPreview(doc.name, doc.filename, doc.blobId, doc.type)"
                class="w-full rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-semibold text-[#00a896] hover:bg-slate-50 cursor-pointer"
              >
                <i class="fa-regular fa-eye mr-1"></i> Visualizar documento
              </button>
            </div>
          </div>
        </div>
      </TabsContent>

      <!-- TAB 3: HISTORIAL -->
      <TabsContent value="history" class="outline-none">
        <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-4">
          <h3 class="text-sm font-bold text-slate-800">Línea de tiempo de la cuenta</h3>
          <div class="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            <div
              v-for="(item, idx) in user.history"
              :key="idx"
              class="relative space-y-1"
            >
              <div class="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white bg-[#00a896] shadow-2xs"></div>
              <span class="text-[11px] font-semibold text-slate-400">{{ item.date }}</span>
              <h4 class="text-xs font-bold text-slate-800">{{ item.title }}</h4>
              <p class="text-xs text-slate-500 leading-relaxed">{{ item.description }}</p>
            </div>
          </div>
        </div>
      </TabsContent>
    </TabsRoot>

    <!-- ======================================================== -->
    <!-- MODAL 1: APROBAR CUENTA DE IMPORTADOR (Image 2)          -->
    <!-- ======================================================== -->
    <DialogRoot v-if="isAdmin" v-model:open="isApproveModalOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity" />
        <DialogContent
          class="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150"
        >
          <!-- Top Bar -->
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <DialogTitle class="text-sm font-bold text-slate-800">
              Aprobar cuenta de importador
            </DialogTitle>
            <DialogClose class="rounded-lg p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
              <i class="fa-solid fa-xmark text-sm"></i>
            </DialogClose>
          </div>

          <!-- Main Title & Question -->
          <div class="text-center space-y-1 pt-1">
            <h3 class="text-base sm:text-lg font-bold text-[#023859]">
              ¿Estás seguro de aprobar esta cuenta?
            </h3>
            <DialogDescription class="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              El usuario podrá publicar sus productos y se le otorgará el check de verificado en la plataforma.
            </DialogDescription>
          </div>

          <!-- User Summary Card -->
          <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex items-center gap-3">
            <div
              :class="[
                'h-10 w-10 shrink-0 flex items-center justify-center rounded-full text-white font-bold text-xs shadow-2xs',
                user.avatar_bg
              ]"
            >
              {{ user.initials }}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <p class="font-bold text-slate-800 text-xs sm:text-sm truncate">
                  {{ user.first_name }} {{ user.last_name }}
                </p>
                <span class="inline-flex items-center gap-1 rounded-full bg-orange-100/70 px-2 py-0.5 text-[10px] font-bold text-[#ea580c]">
                  <span class="h-1.5 w-1.5 rounded-full bg-[#f97316]"></span>
                  Pendiente
                </span>
              </div>
              <p class="text-xs font-semibold text-slate-600 truncate mt-0.5">
                {{ user.business_name }}
              </p>
              <p class="text-[11px] text-slate-400 font-mono">
                RUC <TaxIdDisplay :value="user.ruc" /> · Importador
              </p>
            </div>
          </div>

          <!-- Info Box with checklist -->
          <div class="rounded-xl border border-teal-100 bg-[#f0fdfa] p-4 space-y-2.5 text-xs text-slate-700">
            <div class="flex items-center gap-2 font-bold text-[#00a896]">
              <i class="fa-solid fa-shield-halved"></i>
              <span>Al aprobar esta cuenta:</span>
            </div>
            <div class="space-y-2 pl-1">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-check text-[#00a896] text-xs"></i>
                <span>El usuario podrá publicar y gestionar sus productos.</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-check text-[#00a896] text-xs"></i>
                <span>Su negocio mostrará el estado de cuenta verificada.</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-check text-[#00a896] text-xs"></i>
                <span>Recibirá una notificación por correo sobre la aprobación.</span>
              </div>
            </div>
          </div>

          <!-- Footer Buttons -->
          <div class="flex items-center justify-end gap-3 pt-2">
            <DialogClose
              class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              Cancelar
            </DialogClose>

            <button
              type="button"
              :disabled="isSubmitting"
              @click="handleConfirmApprove"
              class="inline-flex items-center gap-1.5 rounded-xl bg-[#ff6a00] hover:bg-[#ea580c] px-5 py-2 text-xs font-bold text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <i v-if="isSubmitting" class="fa-solid fa-spinner animate-spin text-xs"></i>
              <i v-else class="fa-solid fa-check text-xs"></i>
              <span>Aprobar cuenta</span>
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <!-- ======================================================== -->
    <!-- MODAL 2: RECHAZAR CUENTA DE IMPORTADOR (Image 3)         -->
    <!-- ======================================================== -->
    <DialogRoot v-if="isAdmin" v-model:open="isRejectModalOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity" />
        <DialogContent
          class="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
        >
          <!-- Top Bar -->
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <DialogTitle class="text-sm font-bold text-slate-800">
              Rechazar cuenta de importador
            </DialogTitle>
            <DialogClose class="rounded-lg p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
              <i class="fa-solid fa-xmark text-sm"></i>
            </DialogClose>
          </div>

          <!-- Red Icon Header -->
          <div class="text-center space-y-1.5 pt-1">
            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white shadow-sm">
              <i class="fa-solid fa-xmark text-xl font-bold"></i>
            </div>
            <h3 class="text-base sm:text-lg font-bold text-[#023859]">
              ¿Por qué deseas rechazar esta cuenta?
            </h3>
            <DialogDescription class="text-xs text-slate-500">
              Se enviará un correo al usuario con el motivo del rechazo.
            </DialogDescription>
          </div>

          <!-- Radio Group (Reka UI) -->
          <RadioGroupRoot v-model="rejectionReason" class="space-y-2.5 pt-1">
            <div
              v-for="opt in REJECTION_OPTIONS"
              :key="opt"
              class="flex items-center gap-3 cursor-pointer"
            >
              <RadioGroupItem
                :value="opt"
                class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white hover:border-[#00a896] data-[state=checked]:border-[#00a896] focus:outline-none"
              >
                <RadioGroupIndicator class="h-2 w-2 rounded-full bg-[#00a896]" />
              </RadioGroupItem>
              <label
                @click="rejectionReason = opt"
                class="text-xs font-medium text-slate-700 cursor-pointer select-none"
              >
                {{ opt }}
              </label>
            </div>
          </RadioGroupRoot>

          <!-- Textarea for notes -->
          <div class="space-y-1 pt-2">
            <div class="relative">
              <textarea
                v-model="rejectionNotes"
                maxlength="500"
                rows="3"
                placeholder="Especifica el motivo del rechazo..."
                class="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 font-medium resize-none shadow-2xs"
              ></textarea>
              <span class="absolute bottom-2.5 right-3 text-[10px] text-slate-400">
                {{ rejectionNotes.length }}/500
              </span>
            </div>
          </div>

          <!-- Notice Warning Card -->
          <div class="rounded-xl border border-red-100 bg-[#fef2f2] p-3 flex items-start gap-2.5 text-xs text-red-700">
            <i class="fa-regular fa-envelope text-red-500 text-sm shrink-0 mt-0.5"></i>
            <p class="leading-relaxed">
              El usuario recibirá un correo con el motivo del rechazo y podrá corregir la información y registrarse nuevamente.
            </p>
          </div>

          <!-- Footer Buttons -->
          <div class="flex items-center justify-end gap-3 pt-2">
            <DialogClose
              class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              Cancelar
            </DialogClose>

            <button
              type="button"
              :disabled="isSubmitting"
              @click="handleConfirmReject"
              class="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 px-5 py-2 text-xs font-bold text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <i v-if="isSubmitting" class="fa-solid fa-spinner animate-spin text-xs"></i>
              <i v-else class="fa-solid fa-xmark text-xs"></i>
              <span>Rechazar cuenta</span>
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <!-- Document Preview Modal -->
    <DialogRoot v-model:open="isDocPreviewOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity" />
        <DialogContent
          class="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
        >
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <DialogTitle class="text-sm font-bold text-slate-800">
                {{ previewDoc?.name }}
              </DialogTitle>
              <DialogDescription class="text-xs text-slate-400">
                {{ previewDoc?.filename }}
              </DialogDescription>
            </div>
            <DialogClose class="rounded-lg p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
              <i class="fa-solid fa-xmark text-sm"></i>
            </DialogClose>
          </div>

          <!-- Real Document Preview Content -->
          <div v-if="isLoadingDoc" class="py-12 text-center text-slate-500">
            <i class="fa-solid fa-spinner fa-spin text-2xl text-[#00a896] mb-2"></i>
            <p class="text-xs font-semibold">Cargando documento...</p>
          </div>

          <div v-else-if="docBlobUrl" class="space-y-4">
            <div class="max-h-[60vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
              <img
                v-if="previewDoc?.type === 'image'"
                :src="docBlobUrl"
                :alt="previewDoc?.name"
                class="max-h-[55vh] w-auto mx-auto object-contain rounded-lg shadow-sm"
              />
              <iframe
                v-else
                :src="docBlobUrl"
                class="w-full h-[55vh] rounded-lg border-0"
              ></iframe>
            </div>

            <div class="flex items-center justify-between pt-1">
              <a
                :href="docBlobUrl"
                target="_blank"
                :download="previewDoc?.filename"
                class="inline-flex items-center gap-1.5 text-xs font-bold text-[#00a896] hover:underline"
              >
                <i class="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                <span>Abrir en pestaña nueva / Descargar</span>
              </a>
              <span class="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200/50 px-3 py-1 text-xs font-semibold text-[#00a896]">
                <i class="fa-solid fa-check text-[10px]"></i>
                Documento adjunto real
              </span>
            </div>
          </div>

          <div v-else class="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center space-y-3">
            <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-[#0284c7]">
              <i class="fa-regular fa-file-pdf text-2xl"></i>
            </div>
            <div>
              <p class="font-bold text-slate-800 text-sm">{{ previewDoc?.filename }}</p>
              <p class="text-xs text-slate-400 mt-1">No se pudo cargar la vista previa directa del documento.</p>
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <DialogClose class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
              Cerrar
            </DialogClose>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDepositApi } from "@/api/modules/wallet/deposit/useDepositApi";
import { useVoucherApi } from "@/api/modules/wallet/voucher/useVoucherApi";
import { useToastStore } from "@/stores/ui";
import type { DepositRequestResponse } from "@/api";

const route = useRoute();
const router = useRouter();
const depositApi = useDepositApi();
const voucherApi = useVoucherApi();
const toastStore = useToastStore();

const requestId = (route.params.id as string) || "";
const solicitud = ref<DepositRequestResponse | null>(null);
const voucherDownloadUrl = ref<string | null>(null);

const isLoading = ref(true);
const isActionLoading = ref(false);

// Modals visibility
const showApproveModal = ref(false);
const showRejectModal = ref(false);

// Rejection Form State
const selectedRejectionReason = ref("La referencia no coincide con el comprobante");
const rejectionDetails = ref("");

const rejectionReasons = [
  "La referencia no coincide con el comprobante",
  "El monto no coincide",
  "El comprobante es inválido o ilegible",
  "No pudimos verificar el depósito",
  "Otro motivo",
];

const statusLabel = computed(() => {
  if (!solicitud.value) return "Cargando...";
  switch (solicitud.value.status) {
    case "pending":
      return "Pendiente";
    case "approved":
      return "Aprobada";
    case "rejected":
      return "Rechazada";
  }
});

const statusBadgeClass = computed(() => {
  if (!solicitud.value) return "bg-slate-100 text-slate-500";
  switch (solicitud.value.status) {
    case "pending":
      return "bg-orange-100/70 text-[#ea580c]";
    case "approved":
      return "bg-teal-100/70 text-[#00a896]";
    case "rejected":
      return "bg-slate-200 text-slate-700";
  }
});

const formatCurrency = (amount?: number) => {
  if (amount === undefined || amount === null) return "C$ 0.00";
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
  }).format(amount);
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "No especificada";
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
};

async function loadData() {
  if (!requestId) return;
  isLoading.value = true;
  try {
    const data = await depositApi.getRecharge(requestId);
    solicitud.value = data;

    // Fetch presigned voucher download URL
    try {
      const voucherRes = await voucherApi.getRechargeVoucherUrl(requestId);
      voucherDownloadUrl.value = voucherRes.url;
    } catch (voucherErr) {
      console.warn("[AdminSolicitudDetalle] Voucher URL fetch notice:", voucherErr);
    }
  } catch (err: any) {
    console.error("[AdminSolicitudDetalle] Error loading recharge:", err);
    toastStore.addToast({
      title: "Error de carga",
      message: "No se pudo cargar la solicitud de recarga.",
      variant: "error",
    });
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadData();
});

const openApproveModal = () => {
  if (solicitud.value?.status !== "pending") return;
  showApproveModal.value = true;
};

const openRejectModal = () => {
  if (solicitud.value?.status !== "pending") return;
  showRejectModal.value = true;
};

const confirmApprove = async () => {
  if (!solicitud.value || isActionLoading.value) return;
  isActionLoading.value = true;
  try {
    const updated = await depositApi.approveRecharge(solicitud.value.id);
    solicitud.value = updated;
    showApproveModal.value = false;
    toastStore.addToast({
      title: "Recarga aprobada",
      message: `La recarga de ${formatCurrency(updated.amount)} fue aprobada y acreditada.`,
      variant: "success",
    });
  } catch (err: any) {
    toastStore.addToast({
      title: "Error al aprobar",
      message: err.message || "No se pudo aprobar la solicitud.",
      variant: "error",
    });
  } finally {
    isActionLoading.value = false;
  }
};

const confirmReject = async () => {
  if (!solicitud.value || isActionLoading.value) return;
  const reasonText = rejectionDetails.value.trim()
    ? `${selectedRejectionReason.value}: ${rejectionDetails.value.trim()}`
    : selectedRejectionReason.value;

  isActionLoading.value = true;
  try {
    const updated = await depositApi.rejectRecharge(solicitud.value.id, { reason: reasonText });
    solicitud.value = updated;
    showRejectModal.value = false;
    toastStore.addToast({
      title: "Recarga rechazada",
      message: "La solicitud ha sido rechazada.",
      variant: "warning",
    });
  } catch (err: any) {
    toastStore.addToast({
      title: "Error al rechazar",
      message: err.message || "No se pudo rechazar la solicitud.",
      variant: "error",
    });
  } finally {
    isActionLoading.value = false;
  }
};

const goBack = () => {
  router.push({ name: "admin-payments" });
};
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
    <!-- Top Row: Back Link & Date Badge -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <button
        @click="goBack"
        class="inline-flex items-center gap-2 text-xs font-bold text-[#00a896] hover:underline self-start sm:self-auto cursor-pointer"
      >
        <i class="fa-solid fa-arrow-left"></i>
        <span>Volver a la lista</span>
      </button>

      <div v-if="solicitud" class="self-start sm:self-auto flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-2xs">
        <i class="fa-regular fa-calendar-days text-slate-400"></i>
        <span>{{ formatDate(solicitud.created_at) }}</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
      <i class="fa-solid fa-circle-notch fa-spin text-3xl text-[#00a896]"></i>
      <span class="text-sm font-medium">Cargando detalles de la solicitud...</span>
    </div>

    <template v-else-if="solicitud">
      <!-- Header Card -->
      <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-1">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="font-serif text-2xl sm:text-3xl font-bold text-[#023859]">
            Solicitud de recarga #{{ solicitud.id.slice(0, 8) }}
          </h1>
          <span :class="['inline-flex items-center rounded-full px-3 py-1 text-xs font-bold', statusBadgeClass]">
            {{ statusLabel }}
          </span>
        </div>
        <p class="text-xs text-slate-400 font-mono">
          ID completo: {{ solicitud.id }} • Registrada el {{ formatDate(solicitud.created_at) }}
        </p>

        <!-- Rejection reason banner if rejected -->
        <div v-if="solicitud.status === 'rejected' && solicitud.rejection_reason" class="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-3">
          <i class="fa-solid fa-circle-exclamation text-amber-600 mt-0.5"></i>
          <div>
            <span class="text-xs font-bold text-amber-900 block">Motivo de rechazo:</span>
            <span class="text-xs text-amber-800">{{ solicitud.rejection_reason }}</span>
          </div>
        </div>
      </div>

      <!-- User Account Info Card -->
      <div class="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-xs flex items-center gap-4">
        <div class="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-base shrink-0 ring-2 ring-slate-100">
          <i class="fa-solid fa-user"></i>
        </div>
        <div>
          <h3 class="font-serif text-base font-bold text-[#023859]">
            Cuenta solicitante
          </h3>
          <p class="text-xs text-slate-400 font-mono">
            Account ID: {{ solicitud.account_id }}
          </p>
        </div>
      </div>

      <!-- 2 Column Grid for Details & Verification -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left Card: Datos del depósito -->
        <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-6">
          <h3 class="font-serif text-lg font-bold text-[#023859] border-b border-slate-100 pb-3">
            Datos del depósito
          </h3>

          <div class="space-y-4 text-sm">
            <div class="flex justify-between items-center py-1">
              <span class="text-slate-400 text-xs">Monto depositado:</span>
              <span class="font-bold text-xl text-[#f97316]">{{ formatCurrency(solicitud.amount) }}</span>
            </div>
            <div class="flex justify-between items-center py-1 border-t border-slate-50">
              <span class="text-slate-400 text-xs">ID Cuenta Bancaria Destino:</span>
              <span class="font-bold text-xs font-mono text-[#023859]">{{ solicitud.bank_account_id }}</span>
            </div>
            <div class="flex justify-between items-center py-1 border-t border-slate-50">
              <span class="text-slate-400 text-xs">Número de referencia:</span>
              <span class="font-bold text-xs text-[#00a896] font-mono">{{ solicitud.reference_code || "Sin referencia" }}</span>
            </div>
            <div class="flex justify-between items-center py-1 border-t border-slate-50">
              <span class="text-slate-400 text-xs">Fecha del depósito:</span>
              <span class="font-semibold text-xs text-slate-700">{{ formatDate(solicitud.deposited_at) }}</span>
            </div>
            <div class="flex justify-between items-center py-1 border-t border-slate-50">
              <span class="text-slate-400 text-xs">Última actualización:</span>
              <span class="font-semibold text-xs text-slate-700">{{ formatDate(solicitud.updated_at) }}</span>
            </div>
          </div>
        </div>

        <!-- Right Card: Verificación bancaria y Comprobante -->
        <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-6 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-6">
              <h3 class="font-serif text-lg font-bold text-[#023859]">
                Verificación de Comprobante
              </h3>
              <span
                :class="[
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
                  solicitud.status === 'pending'
                    ? 'bg-orange-50 text-[#f97316]'
                    : solicitud.status === 'approved'
                    ? 'bg-teal-50 text-[#00a896]'
                    : 'bg-slate-100 text-slate-600'
                ]"
              >
                <span
                  :class="[
                    'h-2 w-2 rounded-full',
                    solicitud.status === 'pending' ? 'bg-[#f97316]' : solicitud.status === 'approved' ? 'bg-[#00a896]' : 'bg-slate-500'
                  ]"
                ></span>
                <span>{{ statusLabel }}</span>
              </span>
            </div>

            <!-- Steps Timeline -->
            <div class="space-y-6 relative pl-2">
              <div class="flex gap-4 items-start">
                <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[#00a896] text-xs font-bold">
                  <i class="fa-solid fa-check"></i>
                </div>
                <div>
                  <p class="text-xs font-bold text-[#023859]">Solicitud registrada</p>
                  <p class="text-[11px] text-slate-400">{{ formatDate(solicitud.created_at) }}</p>
                </div>
              </div>

              <div class="flex gap-4 items-start">
                <div
                  :class="[
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    solicitud.status === 'pending' ? 'bg-orange-100 text-[#f97316]' :
                    solicitud.status === 'approved' ? 'bg-teal-100 text-[#00a896]' : 'bg-slate-200 text-slate-600'
                  ]"
                >
                  <i :class="solicitud.status === 'pending' ? 'fa-regular fa-clock' : solicitud.status === 'approved' ? 'fa-solid fa-check' : 'fa-solid fa-xmark'"></i>
                </div>
                <div>
                  <p class="text-xs font-bold text-[#023859]">
                    {{ solicitud.status === 'pending' ? 'En revisión bancaria' : solicitud.status === 'approved' ? 'Recarga Aprobada' : 'Recarga Rechazada' }}
                  </p>
                  <p v-if="solicitud.reviewed_at" class="text-[11px] text-slate-400">
                    Revisada el {{ formatDate(solicitud.reviewed_at) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Comprobante / Voucher Section -->
            <div class="mt-6 space-y-2">
              <p class="text-xs font-bold text-slate-500">Comprobante físico de la transferencia:</p>
              
              <div v-if="voucherDownloadUrl" class="space-y-3">
                <div class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 hover:border-[#00a896]/40 transition-colors">
                  <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 text-[#00a896] shadow-2xs">
                    <i class="fa-solid fa-file-invoice-dollar text-xl"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold text-[#023859] truncate font-mono">Blob: {{ solicitud.voucher_blob_id.slice(0, 16) }}...</p>
                    <p class="text-[11px] text-slate-400">
                      <a :href="voucherDownloadUrl" target="_blank" rel="noopener noreferrer" class="text-[#00a896] hover:underline font-bold inline-flex items-center gap-1">
                        <span>Ver comprobante en tamaño completo</span>
                        <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                      </a>
                    </p>
                  </div>
                </div>

                <!-- Live Image Preview -->
                <div class="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 max-h-56 flex items-center justify-center">
                  <img
                    :src="voucherDownloadUrl"
                    alt="Comprobante de depósito"
                    class="w-full h-full object-contain max-h-56"
                  />
                </div>
              </div>

              <div v-else class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-400">
                <i class="fa-solid fa-file-excel mb-1 text-slate-300 text-lg block"></i>
                <span>Comprobante no disponible o URL expirada.</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="pt-6 flex flex-col sm:flex-row gap-3">
            <button
              @click="openRejectModal"
              :disabled="solicitud.status !== 'pending' || isActionLoading"
              class="flex-1 rounded-xl border-2 border-[#f97316] py-3 text-xs font-bold text-[#f97316] hover:bg-orange-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Rechazar solicitud
            </button>
            <button
              @click="openApproveModal"
              :disabled="solicitud.status !== 'pending' || isActionLoading"
              class="flex-1 rounded-xl bg-[#00a896] py-3 text-xs font-bold text-white hover:bg-[#009688] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Aprobar recarga
            </button>
          </div>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MODAL 1: APROBAR RECARGA -->
      <!-- ========================================== -->
      <div
        v-if="showApproveModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
        @click.self="showApproveModal = false"
      >
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="font-serif text-lg font-bold text-[#023859]">
              Aprobar recarga
            </h3>
            <button
              @click="showApproveModal = false"
              class="text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <p class="text-xs font-bold text-[#023859]">
            ¿Estás seguro de que deseas aprobar esta recarga de saldo?
          </p>

          <div class="space-y-2.5 text-xs">
            <div class="flex justify-between items-center">
              <span class="text-slate-400">Monto:</span>
              <span class="font-bold text-[#f97316] text-base">{{ formatCurrency(solicitud.amount) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">Referencia:</span>
              <span class="font-bold text-[#00a896] font-mono">{{ solicitud.reference_code || "Sin referencia" }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">Cuenta de destino:</span>
              <span class="font-mono text-slate-700 font-bold truncate max-w-[200px]">{{ solicitud.bank_account_id }}</span>
            </div>
          </div>

          <div class="rounded-xl bg-[#e6f7f5] border border-teal-100 p-3.5 text-center">
            <p class="text-xs font-semibold text-[#00a896] leading-relaxed">
              El saldo se acreditará inmediatamente en la billetera virtual del usuario y se registrará la transacción en el libro mayor.
            </p>
          </div>

          <div class="flex gap-3 pt-1">
            <button
              type="button"
              :disabled="isActionLoading"
              @click="showApproveModal = false"
              class="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              :disabled="isActionLoading"
              @click="confirmApprove"
              class="flex-1 rounded-xl bg-[#00a896] py-3 text-xs font-bold text-white hover:bg-[#009688] transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <i v-if="isActionLoading" class="fa-solid fa-circle-notch fa-spin"></i>
              <span>{{ isActionLoading ? 'Procesando...' : 'Aprobar recarga' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MODAL 2: RECHAZAR RECARGA -->
      <!-- ========================================== -->
      <div
        v-if="showRejectModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
        @click.self="showRejectModal = false"
      >
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="font-serif text-lg font-bold text-[#023859]">
              Rechazar recarga
            </h3>
            <button
              @click="showRejectModal = false"
              class="text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <p class="text-xs font-bold text-[#023859]">
            ¿Cuál es el motivo del rechazo?
          </p>

          <div class="space-y-2.5">
            <label
              v-for="reason in rejectionReasons"
              :key="reason"
              class="flex items-center gap-3 cursor-pointer text-xs font-semibold text-[#023859] p-1 select-none"
            >
              <input
                type="radio"
                name="rejectionReason"
                :value="reason"
                v-model="selectedRejectionReason"
                class="h-4 w-4 accent-[#f97316] cursor-pointer"
              />
              <span>{{ reason }}</span>
            </label>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-500">
              Detalles adicionales
            </label>
            <textarea
              v-model="rejectionDetails"
              rows="3"
              placeholder="Escribe un detalle explicativo..."
              class="w-full rounded-xl border border-slate-200 p-3 text-xs text-[#023859] placeholder-slate-400 focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-[#f97316]/15 resize-none"
            ></textarea>
          </div>

          <div class="flex gap-3 pt-1">
            <button
              type="button"
              :disabled="isActionLoading"
              @click="showRejectModal = false"
              class="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              :disabled="isActionLoading"
              @click="confirmReject"
              class="flex-1 rounded-xl bg-[#f97316] py-3 text-xs font-bold text-white hover:bg-[#ea580c] transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <i v-if="isActionLoading" class="fa-solid fa-circle-notch fa-spin"></i>
              <span>{{ isActionLoading ? 'Procesando...' : 'Rechazar recarga' }}</span>
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

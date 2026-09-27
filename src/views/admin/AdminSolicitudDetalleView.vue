<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const requestId = (route.params.id as string) || "REC-000245";
const statusState = ref<"Pendiente" | "Aprobada" | "Rechazada">("Pendiente");

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

const openApproveModal = () => {
  if (statusState.value !== "Pendiente") return;
  showApproveModal.value = true;
};

const openRejectModal = () => {
  if (statusState.value !== "Pendiente") return;
  showRejectModal.value = true;
};

const confirmApprove = () => {
  statusState.value = "Aprobada";
  showApproveModal.value = false;
};

const confirmReject = () => {
  statusState.value = "Rechazada";
  showRejectModal.value = false;
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

      <!-- Date Badge from Image backdrop -->
      <div class="self-start sm:self-auto flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-2xs">
        <i class="fa-regular fa-calendar-days text-slate-400"></i>
        <span>17 de Septiembre, 2026</span>
      </div>
    </div>

    <!-- Header Card -->
    <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-1">
      <div class="flex flex-wrap items-center gap-3">
        <h1 class="font-serif text-2xl sm:text-3xl font-bold text-[#023859]">
          Solicitud de recarga #{{ requestId }}
        </h1>
        <span
          :class="[
            'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold',
            statusState === 'Pendiente'
              ? 'bg-orange-100/70 text-[#ea580c]'
              : statusState === 'Aprobada'
              ? 'bg-teal-100/70 text-[#00a896]'
              : 'bg-slate-200 text-slate-700'
          ]"
        >
          {{ statusState }}
        </span>
      </div>
      <p class="text-xs text-slate-400">
        Creada el 17 Sep 2026, 05:25 PM
      </p>
    </div>

    <!-- User Info Card -->
    <div class="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-xs flex items-center gap-4">
      <img
        src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150"
        alt="María López Vasquez"
        class="h-12 w-12 rounded-full object-cover shrink-0 ring-2 ring-slate-100"
      />
      <div>
        <h3 class="font-serif text-base font-bold text-[#023859]">
          María López Vasquez
        </h3>
        <p class="text-xs text-slate-400">
          maria.lopez@gmail.com • ID Usuario: USR-88321
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
            <span class="font-bold text-base text-[#f97316]">C$ 2,000.00</span>
          </div>
          <div class="flex justify-between items-center py-1 border-t border-slate-50">
            <span class="text-slate-400 text-xs">Banco destino:</span>
            <span class="font-bold text-xs text-[#023859]">Banco Lafise</span>
          </div>
          <div class="flex justify-between items-center py-1 border-t border-slate-50">
            <span class="text-slate-400 text-xs">Titular:</span>
            <span class="font-bold text-xs text-[#023859]">María López Vasquez</span>
          </div>
          <div class="flex justify-between items-center py-1 border-t border-slate-50">
            <span class="text-slate-400 text-xs">Número de referencia:</span>
            <span class="font-bold text-xs text-[#00a896] font-mono">1234567</span>
          </div>
          <div class="flex justify-between items-center py-1 border-t border-slate-50">
            <span class="text-slate-400 text-xs">Fecha de transacción:</span>
            <span class="font-semibold text-xs text-slate-700">17/06/2026</span>
          </div>
          <div class="flex justify-between items-center py-1 border-t border-slate-50">
            <span class="text-slate-400 text-xs">Hora:</span>
            <span class="font-semibold text-xs text-slate-700">05:25 PM</span>
          </div>
        </div>
      </div>

      <!-- Right Card: Verificación bancaria -->
      <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-6 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-6">
            <h3 class="font-serif text-lg font-bold text-[#023859]">
              Verificación bancaria
            </h3>
            <span
              :class="[
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
                statusState === 'Pendiente'
                  ? 'bg-orange-50 text-[#f97316]'
                  : statusState === 'Aprobada'
                  ? 'bg-teal-50 text-[#00a896]'
                  : 'bg-slate-100 text-slate-600'
              ]"
            >
              <span
                :class="[
                  'h-2 w-2 rounded-full',
                  statusState === 'Pendiente' ? 'bg-[#f97316]' : statusState === 'Aprobada' ? 'bg-[#00a896]' : 'bg-slate-500'
                ]"
              ></span>
              <span>{{ statusState === 'Pendiente' ? 'En revisión' : statusState }}</span>
            </span>
          </div>

          <!-- Steps Timeline -->
          <div class="space-y-6 relative pl-2">
            <!-- Step 1 -->
            <div class="flex gap-4 items-start">
              <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[#00a896] text-xs font-bold">
                <i class="fa-solid fa-check"></i>
              </div>
              <div>
                <p class="text-xs font-bold text-[#023859]">Solicitud creada</p>
                <p class="text-[11px] text-slate-400">17 Sep 2026, 05:25 PM</p>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="flex gap-4 items-start">
              <div
                :class="[
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  statusState === 'Pendiente' ? 'bg-orange-100 text-[#f97316]' :
                  statusState === 'Aprobada' ? 'bg-teal-100 text-[#00a896]' : 'bg-slate-200 text-slate-600'
                ]"
              >
                <i :class="statusState === 'Pendiente' ? 'fa-regular fa-clock' : statusState === 'Aprobada' ? 'fa-solid fa-check' : 'fa-solid fa-xmark'"></i>
              </div>
              <div>
                <p class="text-xs font-bold text-[#023859]">
                  {{ statusState === 'Pendiente' ? 'En revisión bancaria' : statusState === 'Aprobada' ? 'Recarga Aprobada' : 'Recarga Rechazada' }}
                </p>
                <p class="text-[11px] text-slate-400">Asignado hoy a las 05:30 PM</p>
              </div>
            </div>
          </div>

          <!-- Comprobante Box -->
          <div class="mt-6 space-y-2">
            <p class="text-xs font-bold text-slate-500">Comprobante de depósito:</p>
            <div class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 hover:border-[#00a896]/40 transition-colors">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 shadow-2xs">
                <i class="fa-regular fa-file-image text-xl"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-[#023859] truncate">recibo_deposito.png</p>
                <p class="text-[11px] text-slate-400">1.4 MB • <a href="#" class="text-[#00a896] hover:underline font-semibold" @click.prevent>Ver imagen completa</a></p>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="pt-6 flex flex-col sm:flex-row gap-3">
          <button
            @click="openRejectModal"
            :disabled="statusState !== 'Pendiente'"
            class="flex-1 rounded-xl border-2 border-[#f97316] py-3 text-xs font-bold text-[#f97316] hover:bg-orange-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Rechazar solicitud
          </button>
          <button
            @click="openApproveModal"
            :disabled="statusState !== 'Pendiente'"
            class="flex-1 rounded-xl bg-[#00a896] py-3 text-xs font-bold text-white hover:bg-[#009688] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Aprobar recarga
          </button>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- MODAL 1: APROBAR RECARGA (Image 4) -->
    <!-- ========================================== -->
    <div
      v-if="showApproveModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
      @click.self="showApproveModal = false"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <!-- Modal Header -->
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

        <!-- Question -->
        <p class="text-xs font-bold text-[#023859]">
          ¿Estás seguro de que deseas aprobar esta recarga?
        </p>

        <!-- Details Summary List -->
        <div class="space-y-2.5 text-xs">
          <div class="flex justify-between items-center">
            <span class="text-slate-400">Usuario:</span>
            <span class="font-bold text-[#023859]">María López</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-400">Monto:</span>
            <span class="font-bold text-[#f97316]">C$ 2,000.00</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-400">Banco:</span>
            <span class="font-bold text-[#023859]">Banco A</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-400">Titular:</span>
            <span class="font-bold text-[#f97316]">María López Vasquez</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-400">Referencia:</span>
            <span class="font-bold text-[#00a896] font-mono">123456789</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-400">Fecha:</span>
            <span class="font-bold text-[#023859]">17/09/2026</span>
          </div>
        </div>

        <!-- Teal Banner Box -->
        <div class="rounded-xl bg-[#e6f7f5] border border-teal-100 p-3.5 text-center">
          <p class="text-xs font-semibold text-[#00a896] leading-relaxed">
            El saldo será acreditado en la billetera del usuario y se enviará una notificación.
          </p>
        </div>

        <!-- Modal Actions -->
        <div class="flex gap-3 pt-1">
          <button
            type="button"
            @click="showApproveModal = false"
            class="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="confirmApprove"
            class="flex-1 rounded-xl bg-[#00a896] py-3 text-xs font-bold text-white hover:bg-[#009688] transition-colors shadow-xs cursor-pointer"
          >
            Aprobar recarga
          </button>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- MODAL 2: RECHAZAR RECARGA (Image 1) -->
    <!-- ========================================== -->
    <div
      v-if="showRejectModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
      @click.self="showRejectModal = false"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <!-- Modal Header -->
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

        <!-- Question -->
        <p class="text-xs font-bold text-[#023859]">
          ¿Cuál es el motivo del rechazo?
        </p>

        <!-- Radio Options List -->
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

        <!-- Textarea Additional Details -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-500">
            Detalles adicionales
          </label>
          <textarea
            v-model="rejectionDetails"
            rows="3"
            placeholder="Escribe un detalle..."
            class="w-full rounded-xl border border-slate-200 p-3 text-xs text-[#023859] placeholder-slate-400 focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-[#f97316]/15 resize-none"
          ></textarea>
        </div>

        <!-- Modal Actions -->
        <div class="flex gap-3 pt-1">
          <button
            type="button"
            @click="showRejectModal = false"
            class="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="confirmReject"
            class="flex-1 rounded-xl bg-[#f97316] py-3 text-xs font-bold text-white hover:bg-[#ea580c] transition-colors shadow-xs cursor-pointer"
          >
            Rechazar recarga
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

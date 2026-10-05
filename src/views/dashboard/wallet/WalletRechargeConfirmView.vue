<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useWalletStore } from "@/stores/wallet";
import { useToastStore } from "@/stores/ui";

const router = useRouter();
const walletStore = useWalletStore();
const toastStore = useToastStore();
const draft = computed(() => walletStore.rechargeDraft);

const isSubmitting = ref(false);

const formattedAmount = computed(() => {
  const num = draft.value.amount ?? 0;
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
  }).format(num);
});

async function handleConfirmAndSubmit() {
  if (!draft.value.platformBankAccountId || !draft.value.amount || !draft.value.voucherFile) {
    toastStore.addToast({
      title: "Datos incompletos",
      message: "Faltan datos de la recarga. Vuelve al paso 1.",
      variant: "warning",
    });
    router.push({ name: "wallet-recharge" });
    return;
  }

  isSubmitting.value = true;
  try {
    await walletStore.submitRecharge();
    toastStore.addToast({
      title: "Solicitud enviada",
      message: "Tu comprobante y solicitud de recarga han sido registrados exitosamente.",
      variant: "success",
    });
    router.push({ name: "wallet-recharge-success" });
  } catch (err: any) {
    toastStore.addToast({
      title: "Error al enviar solicitud",
      message: err.message || "No se pudo registrar la recarga. Por favor intenta de nuevo.",
      variant: "error",
      duration: 5000,
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="flex-1 min-w-0 bg-white overflow-y-auto flex flex-col">
    <!-- Content -->
    <div class="p-8 max-md:p-4 max-w-4xl mx-auto w-full flex-1 flex flex-col">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-[#083c5a] font-serif mb-1">Recargar billetera</h1>
        <p class="text-[0.9rem] text-[#64748b]">Ingresa saldo a tu billetera mediante un depósito o transferencia.</p>
      </div>

      <!-- Stepper -->
      <div class="flex items-center justify-between mb-10 max-w-3xl">
        <div class="flex items-center gap-2 opacity-60 cursor-pointer" @click="!isSubmitting && router.push({ name: 'wallet-recharge' })">
          <div class="w-7 h-7 rounded-full bg-[#cbd5e1] text-white flex items-center justify-center text-xs font-bold">1</div>
          <span class="text-xs font-bold text-[#64748b]">Datos depósito</span>
        </div>
        <div class="flex-1 h-px bg-[#e2e8f0] mx-4"></div>
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full bg-[#083c5a] text-white flex items-center justify-center text-xs font-bold shadow-xs">2</div>
          <span class="text-xs font-bold text-[#083c5a]">Confirmar</span>
        </div>
        <div class="flex-1 h-px bg-[#e2e8f0] mx-4"></div>
        <div class="flex items-center gap-2 opacity-50">
          <div class="w-7 h-7 rounded-full bg-[#cbd5e1] text-white flex items-center justify-center text-xs font-bold">3</div>
          <span class="text-xs font-bold text-[#64748b]">Solicitud enviada</span>
        </div>
      </div>

      <div class="flex-1">
        <h3 class="text-lg font-bold text-[#083c5a] font-serif mb-4">2. Confirma los datos de tu recarga</h3>
        
        <div class="border border-[#189c94] rounded-2xl p-8 mb-8 relative bg-white shadow-sm mt-8">
          <div class="absolute -top-7 left-1/2 -translate-x-1/2 bg-white px-6 py-2 border border-slate-200 rounded-xl flex flex-col items-center shadow-md max-w-md w-full">
            <div class="flex items-center gap-2 mb-0.5">
              <div class="w-6 h-6 bg-[#e6f7f5] rounded-full flex items-center justify-center text-[#189c94]">
                <i class="fa-solid fa-building-columns text-xs"></i>
              </div>
              <span class="text-sm font-bold text-[#083c5a] truncate">{{ draft.bankName || "Banco de la Plataforma" }}</span>
            </div>
            <span class="text-[0.68rem] text-[#64748b] mb-0.5">{{ draft.accountType || "Cuenta Bancaria" }}</span>
            <span class="text-sm font-mono font-bold text-[#083c5a] tracking-wider mb-0.5">{{ draft.accountNumber || "----" }}</span>
            <span class="text-xs text-[#189c94] font-medium">Titular: Mercanto S.A.</span>
          </div>

          <div class="grid grid-cols-2 gap-y-6 gap-x-12 mt-10 max-md:grid-cols-1">
            <div class="flex flex-col gap-1">
              <span class="text-xs font-medium text-[#64748b]">Monto a acreditar:</span>
              <span class="text-2xl font-bold text-[#f97316]">{{ formattedAmount }}</span>
            </div>

            <div class="flex flex-col gap-1">
              <span class="text-xs font-medium text-[#64748b]">Número de referencia:</span>
              <span class="text-base font-bold text-[#083c5a] font-mono">{{ draft.referenceNumber || "Sin referencia" }}</span>
            </div>

            <div class="flex flex-col gap-1">
              <span class="text-xs font-medium text-[#64748b]">Fecha de depósito:</span>
              <span class="text-sm font-bold text-[#083c5a]">{{ draft.depositDate || "No especificada" }}</span>
            </div>

            <div class="flex flex-col gap-1">
              <span class="text-xs font-medium text-[#64748b]">Hora del depósito:</span>
              <span class="text-sm font-bold text-[#083c5a]">{{ draft.depositTime || "No especificada" }}</span>
            </div>

            <div class="flex flex-col gap-1">
              <span class="text-xs font-medium text-[#64748b]">Titular del depósito:</span>
              <span class="text-sm font-bold text-[#083c5a]">{{ draft.depositorName || "No especificado" }}</span>
            </div>

            <div class="flex flex-col gap-1">
              <span class="text-xs font-medium text-[#64748b]">Comprobante adjunto:</span>
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-paperclip text-[#189c94]"></i>
                <span class="text-sm font-bold text-[#189c94] truncate">
                  {{ draft.voucherFileName || "comprobante" }}
                </span>
              </div>
              <img
                v-if="draft.voucherPreviewUrl"
                :src="draft.voucherPreviewUrl"
                alt="Vista previa del comprobante"
                class="mt-2 w-32 h-24 object-cover rounded-lg border border-slate-200 shadow-xs"
              />
            </div>
          </div>
        </div>

        <div class="flex gap-4">
          <button
            type="button"
            :disabled="isSubmitting"
            class="flex-1 py-3 bg-white border-2 border-[#083c5a] text-[#083c5a] rounded-xl font-bold hover:bg-[#f8fafc] transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            @click="router.push({ name: 'wallet-recharge' })"
          >
            <i class="fa-solid fa-arrow-left"></i> Modificar datos
          </button>
          <button
            type="button"
            :disabled="isSubmitting"
            class="flex-1 py-3.5 bg-[#f97316] text-white rounded-xl font-bold hover:bg-[#ea580c] transition-colors text-base shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleConfirmAndSubmit"
          >
            <span v-if="isSubmitting" class="flex items-center gap-2">
              <i class="fa-solid fa-circle-notch fa-spin"></i>
              <span>Subiendo comprobante y enviando...</span>
            </span>
            <template v-else>
              <span>Confirmar y enviar solicitud</span>
              <i class="fa-solid fa-arrow-right"></i>
            </template>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

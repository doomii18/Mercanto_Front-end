<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useWalletStore } from "@/stores/wallet";

const router = useRouter();
const walletStore = useWalletStore();
const draft = computed(() => walletStore.rechargeDraft);
const lastRecharge = computed(() => walletStore.lastSubmittedRecharge);

const formattedAmount = computed(() => {
  const num = lastRecharge.value?.amount ?? draft.value.amount ?? 0;
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
  }).format(num);
});

const handleReturn = () => {
  walletStore.resetRechargeDraft();
  router.push({ name: "wallet" });
};
</script>

<template>
  <div class="flex-1 min-w-0 bg-white overflow-y-auto flex flex-col">
    <!-- Content -->
    <div class="p-8 max-md:p-4 max-w-4xl mx-auto w-full flex-1 flex flex-col items-center">
      <div class="mb-8 w-full">
        <h1 class="text-2xl font-bold text-[#083c5a] font-serif mb-1">Recargar billetera</h1>
        <p class="text-[0.9rem] text-[#64748b]">Ingresa saldo a tu billetera mediante un depósito o transferencia.</p>
      </div>

      <!-- Stepper -->
      <div class="flex items-center justify-between mb-12 max-w-3xl w-full">
        <div class="flex items-center gap-2 opacity-50">
          <div class="w-7 h-7 rounded-full bg-[#cbd5e1] text-white flex items-center justify-center text-xs font-bold">1</div>
          <span class="text-xs font-bold text-[#64748b]">Datos depósito</span>
        </div>
        <div class="flex-1 h-px bg-[#e2e8f0] mx-4"></div>
        <div class="flex items-center gap-2 opacity-50">
          <div class="w-7 h-7 rounded-full bg-[#cbd5e1] text-white flex items-center justify-center text-xs font-bold">2</div>
          <span class="text-xs font-bold text-[#64748b]">Confirmar</span>
        </div>
        <div class="flex-1 h-px bg-[#e2e8f0] mx-4"></div>
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full bg-[#189c94] text-white flex items-center justify-center text-xs font-bold shadow-xs">
            <i class="fa-solid fa-check"></i>
          </div>
          <span class="text-xs font-bold text-[#189c94]">Solicitud enviada</span>
        </div>
      </div>

      <!-- Success State -->
      <div class="flex flex-col items-center text-center max-w-2xl w-full">
        <div class="w-16 h-16 rounded-full bg-[#189c94] flex items-center justify-center text-white mb-6 shadow-md">
          <i class="fa-solid fa-check text-2xl"></i>
        </div>
        <h2 class="text-[1.7rem] font-bold text-[#083c5a] font-serif mb-3 tracking-tight">¡Solicitud enviada con éxito!</h2>
        <p class="text-[#64748b] text-[0.95rem] mb-8 leading-relaxed px-4">
          Tu solicitud de registro de depósito ha sido recibida y se encuentra en proceso de revisión. Te notificaremos una vez que el saldo sea acreditado a tu billetera virtual (plazo estimado de 1 a 24 horas hábiles).
        </p>

        <div class="w-full border border-[#189c94] rounded-2xl p-8 mb-8 text-left bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h3 class="text-lg font-bold text-[#083c5a] font-serif">Resumen del depósito</h3>
            <span class="px-3 py-1 bg-[#e6f7f5] text-[#189c94] text-[0.7rem] font-bold rounded-full uppercase tracking-wider">
              En revisión
            </span>
          </div>

          <div class="flex flex-col gap-4">
            <div v-if="lastRecharge?.id" class="flex justify-between items-center py-1">
              <span class="text-[0.9rem] text-[#64748b]">ID de solicitud</span>
              <span class="text-[0.85rem] font-bold text-[#083c5a] font-mono">{{ lastRecharge.id }}</span>
            </div>
            <div v-if="lastRecharge?.id" class="h-px w-full bg-[#f1f5f9]"></div>

            <div class="flex justify-between items-center py-1">
              <span class="text-[0.9rem] text-[#64748b]">Monto solicitado</span>
              <span class="text-[1.15rem] font-bold text-[#f97316]">{{ formattedAmount }}</span>
            </div>
            <div class="h-px w-full bg-[#f1f5f9]"></div>

            <div class="flex justify-between items-center py-1">
              <span class="text-[0.9rem] text-[#64748b]">Número de referencia</span>
              <span class="text-[0.95rem] font-bold text-[#083c5a] font-mono">{{ lastRecharge?.reference_code || draft.referenceNumber || "Sin referencia" }}</span>
            </div>
            <div class="h-px w-full bg-[#f1f5f9]"></div>

            <div class="flex justify-between items-center py-1">
              <span class="text-[0.9rem] text-[#64748b]">Fecha y hora</span>
              <span class="text-[0.95rem] font-bold text-[#333]">{{ draft.depositDate || "Hoy" }} • {{ draft.depositTime || "" }}</span>
            </div>
            <div class="h-px w-full bg-[#f1f5f9]"></div>

            <div v-if="draft.depositorName" class="flex justify-between items-center py-1">
              <span class="text-[0.9rem] text-[#64748b]">Titular del depósito</span>
              <span class="text-[0.95rem] font-bold text-[#333]">{{ draft.depositorName }}</span>
            </div>
            <div v-if="draft.depositorName" class="h-px w-full bg-[#f1f5f9]"></div>

            <div class="flex justify-between items-center py-1">
              <span class="text-[0.9rem] text-[#64748b]">Banco destino</span>
              <span class="text-[0.95rem] font-bold text-[#333]">{{ draft.bankName || "Cuenta oficial" }} ({{ draft.accountType || "" }})</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          class="w-full py-3.5 bg-[#f97316] text-white rounded-xl font-bold hover:bg-[#ea580c] transition-colors text-base shadow-md cursor-pointer active:scale-99"
          @click="handleReturn"
        >
          Volver a mi billetera
        </button>
      </div>
    </div>
  </div>
</template>

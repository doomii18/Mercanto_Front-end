<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

function goToNewDeposit() {
  router.push({ name: "wallet-recharge" });
}

function goToWallet() {
  router.push({ name: "wallet" });
}
</script>

<template>
  <div class="flex-1 min-h-0 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
    <div
      class="bg-white rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-10 max-w-[460px] w-full text-center flex flex-col items-center border border-[#eee]"
    >
      <div
        class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#fef2f2] flex items-center justify-center mb-4 sm:mb-6"
      >
        <i class="fa-solid fa-xmark text-xl sm:text-2xl text-[#ef4444]"></i>
      </div>
      <h2 class="text-xl sm:text-2xl font-bold text-[#083c5a] mb-2 font-serif tracking-tight">
        Recarga no aprobada
      </h2>
      <div class="text-2xl sm:text-[2.2rem] font-bold text-[#ef4444] mb-2 tracking-tight">
        C$ 2,000.00
      </div>
      <p class="text-[#64748b] text-xs sm:text-[0.95rem] mb-6">
        Tu solicitud <strong>REC-000245</strong> no pudo ser verificada.
      </p>
      <div
        class="w-full bg-[#fef2f2] border border-[#fecaca] rounded-xl p-3.5 sm:p-4 flex gap-3 text-left mb-6"
      >
        <i class="fa-solid fa-triangle-exclamation text-[#ef4444] mt-0.5"></i>
        <div class="flex flex-col">
          <span class="text-[#b91c1c] text-[0.75rem] font-bold mb-0.5">Motivo de rechazo</span>
          <span class="text-[#ef4444] text-xs sm:text-[0.85rem] leading-relaxed">
            La referencia ingresada no coincide con el comprobante de depósito.
          </span>
        </div>
      </div>
      <div class="w-full text-left mb-6 sm:mb-8">
        <h4 class="text-[#083c5a] font-bold text-xs sm:text-[0.95rem] mb-1">¿Qué podés hacer?</h4>
        <p class="text-[#64748b] text-xs sm:text-[0.85rem] leading-relaxed">
          Podés registrar nuevamente una recarga con los datos correctos del comprobante original.
        </p>
      </div>
      <button
        type="button"
        class="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold py-3 sm:py-3.5 rounded-xl transition-colors mb-3 text-sm cursor-pointer"
        @click="goToNewDeposit"
      >
        Confirmar nueva recarga
      </button>
      <button
        type="button"
        class="w-full bg-white border border-[#e2e8f0] text-[#083c5a] hover:bg-[#f8fafc] font-semibold py-3 sm:py-3.5 rounded-xl transition-colors text-sm cursor-pointer"
        @click="goToWallet"
      >
        Volver a mi billetera
      </button>
    </div>
  </div>
</template>

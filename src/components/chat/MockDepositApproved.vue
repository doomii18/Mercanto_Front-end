<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

function goToWallet() {
  router.push({ name: "wallet" });
}

function goToHome() {
  router.push({ name: "dashboard" });
}
</script>

<template>
  <div class="flex-1 min-h-0 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
    <div
      class="bg-white rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-10 max-w-[460px] w-full text-center flex flex-col items-center border border-[#eee]"
    >
      <div
        class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#e6f7f5] flex items-center justify-center mb-4 sm:mb-6"
      >
        <i class="fa-solid fa-check text-xl sm:text-2xl text-[#189c94]"></i>
      </div>
      <h2 class="text-xl sm:text-2xl font-bold text-[#083c5a] mb-2 font-serif tracking-tight">
        ¡Recarga aprobada!
      </h2>
      <p class="text-[#64748b] text-xs sm:text-[0.95rem] mb-6">
        Tu billetera ha sido recargada exitosamente.
      </p>
      <div class="text-2xl sm:text-[2.2rem] font-bold text-[#189c94] mb-6 sm:mb-8 tracking-tight">
        + C$ 2,000.00
      </div>
      <div
        class="w-full bg-[#f8fafc] border border-[#f1f5f9] rounded-xl py-3.5 flex flex-col items-center mb-6 sm:mb-8"
      >
        <span class="text-[0.7rem] text-[#64748b] mb-0.5 uppercase tracking-wide font-semibold"
          >Saldo actual</span
        >
        <span class="text-base sm:text-lg font-bold text-[#083c5a]">C$ 8,500.00</span>
      </div>
      <button
        type="button"
        class="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold py-3 sm:py-3.5 rounded-xl transition-colors mb-3 text-sm cursor-pointer"
        @click="goToWallet"
      >
        Ver billetera
      </button>
      <button
        type="button"
        class="w-full bg-white border border-[#e2e8f0] text-[#083c5a] hover:bg-[#f8fafc] font-semibold py-3 sm:py-3.5 rounded-xl transition-colors text-sm cursor-pointer"
        @click="goToHome"
      >
        Volver al inicio
      </button>
    </div>
  </div>
</template>

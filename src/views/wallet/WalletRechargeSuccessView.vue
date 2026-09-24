<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <div class="flex-1 min-w-0 bg-white overflow-y-auto flex flex-col">
    <!-- Header Area -->
    <div class="flex items-center justify-between px-8 py-6 border-b border-[#eee] max-md:px-4 shrink-0 bg-white sticky top-0 z-10">
      <div class="flex-1 flex justify-between items-center bg-[#f4f7f9] rounded-full px-4 py-2 mr-4 max-w-lg">
        <div class="flex items-center gap-2 text-[#888] flex-1">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" placeholder="Buscar productos..." class="bg-transparent border-none outline-none text-sm w-full" />
        </div>
      </div>
      <div class="flex items-center gap-4 shrink-0">
        <button class="relative text-[#64748b] hover:text-[#083c5a]">
          <i class="fa-regular fa-bell text-xl"></i>
          <span class="absolute top-0 right-0 w-2 h-2 bg-[#ff6a00] rounded-full"></span>
        </button>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-gray-300 overflow-hidden"></div>
          <div class="flex flex-col max-md:hidden">
            <span class="text-xs font-bold text-[#083c5a]">María López</span>
            <span class="text-[0.65rem] text-[#64748b]">Comprador</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-8 max-md:p-4 max-w-4xl mx-auto w-full flex-1 flex flex-col items-center">
      <div class="mb-8 w-full">
        <h1 class="text-2xl font-bold text-[#083c5a] font-serif mb-1">Recargar billetera</h1>
        <p class="text-[0.9rem] text-[#64748b]">Ingresa saldo a tu billetera mediante un depósito o transferencia.</p>
      </div>

      <!-- Stepper -->
      <div class="flex items-center justify-between mb-12 max-w-3xl w-full">
        <div class="flex items-center gap-2 opacity-50">
          <div class="w-6 h-6 rounded-full bg-[#cbd5e1] text-white flex items-center justify-center text-xs font-bold">1</div>
          <span class="text-xs font-bold text-[#64748b]">Datos depósito</span>
        </div>
        <div class="flex-1 h-px bg-[#e2e8f0] mx-4"></div>
        <div class="flex items-center gap-2 opacity-50">
          <div class="w-6 h-6 rounded-full bg-[#cbd5e1] text-white flex items-center justify-center text-xs font-bold">2</div>
          <span class="text-xs font-bold text-[#64748b]">Confirmar</span>
        </div>
        <div class="flex-1 h-px bg-[#e2e8f0] mx-4"></div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full bg-[#083c5a] text-white flex items-center justify-center text-xs font-bold">3</div>
          <span class="text-xs font-bold text-[#083c5a]">Solicitud enviada</span>
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
          <div class="flex items-center justify-between border-b border-[#eee] pb-4 mb-4">
            <h3 class="text-lg font-bold text-[#083c5a] font-serif">Resumen del depósito</h3>
            <span class="px-3 py-1 bg-[#e6f7f5] text-[#189c94] text-[0.7rem] font-bold rounded-full uppercase tracking-wider">En revisión</span>
          </div>

          <div class="flex flex-col gap-4">
            <div class="flex justify-between items-center py-1">
              <span class="text-[0.9rem] text-[#64748b]">Monto depositado</span>
              <span class="text-[1.05rem] font-bold text-[#f97316]">C$ 2,000.00</span>
            </div>
            <div class="h-px w-full bg-[#f1f5f9]"></div>
            <div class="flex justify-between items-center py-1">
              <span class="text-[0.9rem] text-[#64748b]">Número de referencia</span>
              <span class="text-[0.95rem] font-bold text-[#333]">1234567</span>
            </div>
            <div class="h-px w-full bg-[#f1f5f9]"></div>
            <div class="flex justify-between items-center py-1">
              <span class="text-[0.9rem] text-[#64748b]">Fecha de depósito</span>
              <span class="text-[0.95rem] font-bold text-[#333]">17/06/2026</span>
            </div>
            <div class="h-px w-full bg-[#f1f5f9]"></div>
            <div class="flex justify-between items-center py-1">
              <span class="text-[0.9rem] text-[#64748b]">Hora del depósito</span>
              <span class="text-[0.95rem] font-bold text-[#333]">05:25 PM</span>
            </div>
            <div class="h-px w-full bg-[#f1f5f9]"></div>
            <div class="flex justify-between items-center py-1">
              <span class="text-[0.9rem] text-[#64748b]">Titular del depósito</span>
              <span class="text-[0.95rem] font-bold text-[#333]">María López Vásquez</span>
            </div>
            <div class="h-px w-full bg-[#f1f5f9]"></div>
            <div class="flex justify-between items-center py-1">
              <span class="text-[0.9rem] text-[#64748b]">Comprobante</span>
              <span class="text-[0.95rem] font-bold text-[#189c94]">recibo.png</span>
            </div>
            <div class="h-px w-full bg-[#f1f5f9]"></div>
            <div class="flex justify-between items-center py-1">
              <span class="text-[0.9rem] text-[#64748b]">Banco destino</span>
              <span class="text-[0.95rem] font-bold text-[#333]">Banco Lafise (Cuenta Corriente - C$)</span>
            </div>
          </div>
        </div>

        <button @click="router.push({ name: 'wallet' })" class="w-full py-3.5 bg-[#f97316] text-white rounded-lg font-bold hover:bg-[#ea580c] transition-colors text-lg shadow-sm">
          Volver a mi billetera
        </button>
      </div>
    </div>
  </div>
</template>

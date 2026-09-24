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
    <div class="p-8 max-md:p-4 max-w-4xl mx-auto w-full flex-1 flex flex-col">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-[#083c5a] font-serif mb-1">Recargar billetera</h1>
        <p class="text-[0.9rem] text-[#64748b]">Ingresa saldo a tu billetera mediante un depósito o transferencia.</p>
      </div>

      <!-- Stepper -->
      <div class="flex items-center justify-between mb-10 max-w-3xl">
        <div class="flex items-center gap-2 opacity-50 cursor-pointer" @click="router.push({ name: 'wallet-recharge' })">
          <div class="w-6 h-6 rounded-full bg-[#cbd5e1] text-white flex items-center justify-center text-xs font-bold">1</div>
          <span class="text-xs font-bold text-[#64748b]">Datos depósito</span>
        </div>
        <div class="flex-1 h-px bg-[#e2e8f0] mx-4"></div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full bg-[#083c5a] text-white flex items-center justify-center text-xs font-bold">2</div>
          <span class="text-xs font-bold text-[#083c5a]">Confirmar</span>
        </div>
        <div class="flex-1 h-px bg-[#e2e8f0] mx-4"></div>
        <div class="flex items-center gap-2 opacity-50">
          <div class="w-6 h-6 rounded-full bg-[#cbd5e1] text-white flex items-center justify-center text-xs font-bold">3</div>
          <span class="text-xs font-bold text-[#64748b]">Solicitud enviada</span>
        </div>
      </div>

      <div class="flex-1">
        <h3 class="text-lg font-bold text-[#083c5a] font-serif mb-4">2. Confirma los datos</h3>
        
        <div class="border border-[#189c94] rounded-2xl p-8 mb-8 relative">
          <div class="absolute -top-7 left-1/2 -translate-x-1/2 bg-white px-6 py-2 border border-[#eee] rounded-xl flex flex-col items-center shadow-sm">
            <div class="flex items-center gap-2 mb-1">
              <div class="w-5 h-5 bg-[#e6f7f5] rounded-full flex items-center justify-center text-[#189c94]">
                <i class="fa-solid fa-building-columns text-[0.6rem]"></i>
              </div>
              <span class="text-sm font-bold text-[#083c5a]">Banco Lafise</span>
            </div>
            <span class="text-[0.65rem] text-[#64748b] mb-1">Cuenta Corriente - C$</span>
            <span class="text-sm font-bold text-[#083c5a] tracking-wider mb-0.5">1234-5678-9012</span>
            <span class="text-xs text-[#189c94]">Titular: Mercanto S.A.</span>
          </div>

          <div class="grid grid-cols-2 gap-y-6 gap-x-12 mt-10 max-md:grid-cols-1">
            <div class="flex flex-col gap-1">
              <span class="text-[0.85rem] text-[#64748b]">Monto depositado:</span>
              <span class="text-[1.1rem] font-bold text-[#f97316]">C$ 2000</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[0.85rem] text-[#64748b]">Comprobante:</span>
              <span class="text-[0.95rem] font-bold text-[#189c94]">recibo.png</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[0.85rem] text-[#64748b]">Número de referencia:</span>
              <span class="text-[0.95rem] font-bold text-[#189c94]">1234567</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[0.85rem] text-[#64748b]">Fecha:</span>
              <span class="text-[0.95rem] font-bold text-[#189c94]">17/06/2026</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[0.85rem] text-[#64748b]">Titular:</span>
              <span class="text-[0.95rem] font-bold text-[#189c94]">María Lopéz Vasquez</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-[0.85rem] text-[#64748b]">Hora:</span>
              <span class="text-[0.95rem] font-bold text-[#189c94]">05:25 PM</span>
            </div>
          </div>
        </div>

        <button @click="router.push({ name: 'wallet-recharge-success' })" class="w-full py-3.5 bg-[#f97316] text-white rounded-lg font-bold hover:bg-[#ea580c] transition-colors text-lg">
          Continuar
        </button>
      </div>
    </div>
  </div>
</template>

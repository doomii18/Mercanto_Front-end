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
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full bg-[#083c5a] text-white flex items-center justify-center text-xs font-bold">1</div>
          <span class="text-xs font-bold text-[#083c5a]">Datos depósito</span>
        </div>
        <div class="flex-1 h-px bg-[#e2e8f0] mx-4"></div>
        <div class="flex items-center gap-2 opacity-50">
          <div class="w-6 h-6 rounded-full bg-[#cbd5e1] text-white flex items-center justify-center text-xs font-bold">2</div>
          <span class="text-xs font-bold text-[#64748b]">Confirmar</span>
        </div>
        <div class="flex-1 h-px bg-[#e2e8f0] mx-4"></div>
        <div class="flex items-center gap-2 opacity-50">
          <div class="w-6 h-6 rounded-full bg-[#cbd5e1] text-white flex items-center justify-center text-xs font-bold">3</div>
          <span class="text-xs font-bold text-[#64748b]">Solicitud enviada</span>
        </div>
      </div>

      <div class="flex-1">
        <h3 class="text-lg font-bold text-[#083c5a] font-serif mb-4">1. Realizá tu depósito</h3>
        <div class="grid grid-cols-2 gap-4 mb-8 max-md:grid-cols-1">
          <!-- Banco Lafise -->
          <div class="border border-[#e2e8f0] rounded-xl p-5 flex flex-col">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-8 h-8 bg-[#e6f7f5] rounded-full flex items-center justify-center text-[#189c94]">
                <i class="fa-solid fa-building-columns text-sm"></i>
              </div>
              <div class="flex flex-col">
                <span class="text-sm font-bold text-[#083c5a]">Banco Lafise</span>
                <span class="text-[0.65rem] text-[#64748b]">Cuenta Corriente - C$</span>
              </div>
            </div>
            <span class="text-lg font-bold text-[#083c5a] tracking-wider mb-1">1234-5678-9012</span>
            <span class="text-xs text-[#64748b] mb-4">Titular: Mercanto S.A.</span>
            <button class="w-full py-2 bg-white border border-[#083c5a] text-[#083c5a] rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#f8fafc] transition-colors mt-auto">
              <i class="fa-regular fa-copy"></i> Copiar número
            </button>
          </div>
          <!-- BAC Credomatic -->
          <div class="border border-[#e2e8f0] rounded-xl p-5 flex flex-col">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-8 h-8 bg-[#fef2f2] rounded-full flex items-center justify-center text-[#ef4444]">
                <i class="fa-solid fa-building-columns text-sm"></i>
              </div>
              <div class="flex flex-col">
                <span class="text-sm font-bold text-[#083c5a]">BAC Credomatic</span>
                <span class="text-[0.65rem] text-[#64748b]">Cuenta de Ahorros - C$</span>
              </div>
            </div>
            <span class="text-lg font-bold text-[#083c5a] tracking-wider mb-1">9876-5432-1098</span>
            <span class="text-xs text-[#64748b] mb-4">Titular: Mercanto S.A.</span>
            <button class="w-full py-2 bg-white border border-[#083c5a] text-[#083c5a] rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#f8fafc] transition-colors mt-auto">
              <i class="fa-regular fa-copy"></i> Copiar número
            </button>
          </div>
        </div>

        <h3 class="text-lg font-bold text-[#083c5a] font-serif mb-4">2. Registrá tu recarga</h3>
        <form class="flex flex-col gap-4 mb-8" @submit.prevent="router.push({ name: 'wallet-recharge-confirm' })">
          <div class="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-[#083c5a]">Monto depositado *</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#888]">C$</span>
                <input type="text" placeholder="0.00" class="w-full border border-[#e2e8f0] rounded-lg py-2.5 pl-9 pr-3 text-sm text-[#333] outline-none focus:border-[#189c94]" />
              </div>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-[#083c5a]">Banco emisor *</label>
              <select class="w-full border border-[#e2e8f0] rounded-lg py-2.5 px-3 text-sm text-[#333] outline-none focus:border-[#189c94] bg-white appearance-none">
                <option value="" disabled selected>Selecciona un banco</option>
                <option value="lafise">Banco Lafise</option>
                <option value="bac">BAC Credomatic</option>
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-[#083c5a]">Número de referencia *</label>
              <input type="text" placeholder="Ej: 12345678" class="w-full border border-[#e2e8f0] rounded-lg py-2.5 px-3 text-sm text-[#333] outline-none focus:border-[#189c94]" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-[#083c5a]">Fecha de depósito *</label>
              <input type="text" placeholder="dd/mm/aaaa" class="w-full border border-[#e2e8f0] rounded-lg py-2.5 px-3 text-sm text-[#333] outline-none focus:border-[#189c94]" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-[#083c5a]">Titular del depósito</label>
              <input type="text" placeholder="Ej: Juan Marcos Caballero" class="w-full border border-[#e2e8f0] rounded-lg py-2.5 px-3 text-sm text-[#333] outline-none focus:border-[#189c94]" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-[#083c5a]">Hora del depósito *</label>
              <input type="text" placeholder="00: 00 PM" class="w-full border border-[#e2e8f0] rounded-lg py-2.5 px-3 text-sm text-[#333] outline-none focus:border-[#189c94]" />
            </div>
          </div>

          <!-- Upload Box -->
          <div class="border-2 border-dashed border-[#e2e8f0] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#f8fafc] transition-colors mt-2">
            <i class="fa-solid fa-cloud-arrow-up text-2xl text-[#64748b] mb-2"></i>
            <span class="text-sm font-bold text-[#083c5a]">Sube tu comprobante de depósito</span>
            <span class="text-xs text-[#64748b]">Formatos aceptados: PNG, JPG, PDF (Max. 5MB)</span>
          </div>

          <div class="flex gap-4 mt-6">
            <button type="button" @click="router.push({ name: 'wallet' })" class="flex-1 py-3 bg-white border-2 border-[#083c5a] text-[#083c5a] rounded-lg font-bold hover:bg-[#f8fafc] transition-colors flex items-center justify-center gap-2">
              <i class="fa-solid fa-arrow-left"></i> Volver atrás
            </button>
            <button type="submit" class="flex-1 py-3 bg-[#f97316] text-white rounded-lg font-bold hover:bg-[#ea580c] transition-colors">
              Continuar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

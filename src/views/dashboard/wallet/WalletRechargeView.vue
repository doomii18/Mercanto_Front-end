<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useClipboard } from "@vueuse/core";
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
} from "reka-ui";
import BaseFileDropZone from "@/components/common/BaseFileDropZone.vue";
import BaseTimeInput from "@/components/common/BaseTimeInput.vue";
import { useWalletStore } from "@/stores/wallet";
import { useToastStore } from "@/stores/ui";

const router = useRouter();
const walletStore = useWalletStore();
const toastStore = useToastStore();
const { copy } = useClipboard();

const copiedBank = ref<string | null>(null);

const handleCopyAccount = (number: string, bankId: string) => {
  copy(number);
  copiedBank.value = bankId;
  toastStore.addToast({
    title: "Número copiado",
    message: `Número de cuenta ${number} copiado al portapapeles.`,
    variant: "success",
    duration: 2500,
  });
  setTimeout(() => {
    if (copiedBank.value === bankId) copiedBank.value = null;
  }, 2500);
};

const BANK_OPTIONS = [
  {
    id: "lafise",
    name: "Banco Lafise",
    accountNumber: "1234-5678-9012",
    accountType: "Cuenta Corriente - C$",
    iconClass: "bg-[#e6f7f5] text-[#189c94]",
  },
  {
    id: "bac",
    name: "BAC Credomatic",
    accountNumber: "9876-5432-1098",
    accountType: "Cuenta de Ahorros - C$",
    iconClass: "bg-[#fef2f2] text-[#ef4444]",
  },
  {
    id: "banpro",
    name: "Banpro Grupo Promerica",
    accountNumber: "1002-3344-5566",
    accountType: "Cuenta Corriente - C$",
    iconClass: "bg-[#ecfdf5] text-[#059669]",
  },
  {
    id: "ficohsa",
    name: "Banco Ficohsa",
    accountNumber: "4567-8901-2345",
    accountType: "Cuenta de Ahorros - C$",
    iconClass: "bg-[#fffbeb] text-[#d97706]",
  },
];

const selectedBankId = ref(walletStore.rechargeDraft.bank || "lafise");
const amount = ref<number | null>(walletStore.rechargeDraft.amount || null);
const referenceNumber = ref(walletStore.rechargeDraft.referenceNumber || "");
const depositDate = ref(
  walletStore.rechargeDraft.depositDate || new Date().toISOString().split("T")[0]
);
const now = new Date();
const formattedCurrentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
const depositTime = ref(walletStore.rechargeDraft.depositTime || formattedCurrentTime);
const depositorName = ref(walletStore.rechargeDraft.depositorName || "");
const voucherFile = ref<File | null>(walletStore.rechargeDraft.voucherFile || null);

const currentBank = computed(
  () => BANK_OPTIONS.find((b) => b.id === selectedBankId.value) || BANK_OPTIONS[0]
);

const handleDropError = (msg: string) => {
  toastStore.addToast({
    title: "Archivo inválido",
    message: msg,
    variant: "error",
  });
};

const handleContinue = () => {
  if (!amount.value || amount.value <= 0) {
    toastStore.addToast({
      title: "Monto requerido",
      message: "Por favor ingresa un monto válido a recargar.",
      variant: "warning",
    });
    return;
  }

  if (!referenceNumber.value.trim()) {
    toastStore.addToast({
      title: "Número de referencia requerido",
      message: "Ingresa el número de referencia del comprobante bancario.",
      variant: "warning",
    });
    return;
  }

  let previewUrl: string | null = null;
  if (voucherFile.value && voucherFile.value.type.startsWith("image/")) {
    previewUrl = URL.createObjectURL(voucherFile.value);
  }

  walletStore.setRechargeDraft({
    amount: amount.value,
    bank: selectedBankId.value,
    bankName: currentBank.value.name,
    accountNumber: currentBank.value.accountNumber,
    accountType: currentBank.value.accountType,
    referenceNumber: referenceNumber.value.trim(),
    depositDate: depositDate.value,
    depositTime: depositTime.value,
    depositorName: depositorName.value.trim(),
    voucherFile: voucherFile.value,
    voucherFileName: voucherFile.value?.name || "comprobante.png",
    voucherPreviewUrl: previewUrl,
  });

  router.push({ name: "wallet-recharge-confirm" });
};
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
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full bg-[#083c5a] text-white flex items-center justify-center text-xs font-bold shadow-xs">1</div>
          <span class="text-xs font-bold text-[#083c5a]">Datos depósito</span>
        </div>
        <div class="flex-1 h-px bg-[#e2e8f0] mx-4"></div>
        <div class="flex items-center gap-2 opacity-50">
          <div class="w-7 h-7 rounded-full bg-[#cbd5e1] text-white flex items-center justify-center text-xs font-bold">2</div>
          <span class="text-xs font-bold text-[#64748b]">Confirmar</span>
        </div>
        <div class="flex-1 h-px bg-[#e2e8f0] mx-4"></div>
        <div class="flex items-center gap-2 opacity-50">
          <div class="w-7 h-7 rounded-full bg-[#cbd5e1] text-white flex items-center justify-center text-xs font-bold">3</div>
          <span class="text-xs font-bold text-[#64748b]">Solicitud enviada</span>
        </div>
      </div>

      <div class="flex-1">
        <h3 class="text-lg font-bold text-[#083c5a] font-serif mb-4">1. Cuentas bancarias oficiales de Mercanto</h3>
        
        <!-- Bank Accounts Grid -->
        <div class="grid grid-cols-2 gap-4 mb-8 max-md:grid-cols-1">
          <div
            v-for="b in BANK_OPTIONS"
            :key="b.id"
            class="border rounded-2xl p-5 flex flex-col transition-all cursor-pointer"
            :class="
              selectedBankId === b.id
                ? 'border-[#189c94] bg-[#f8fffe] shadow-xs ring-1 ring-[#189c94]/30'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            "
            @click="selectedBankId = b.id"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" :class="b.iconClass">
                  <i class="fa-solid fa-building-columns text-sm"></i>
                </div>
                <div class="flex flex-col">
                  <span class="text-sm font-bold text-[#083c5a]">{{ b.name }}</span>
                  <span class="text-[0.68rem] text-[#64748b]">{{ b.accountType }}</span>
                </div>
              </div>
              <span
                v-if="selectedBankId === b.id"
                class="w-5 h-5 rounded-full bg-[#189c94] text-white flex items-center justify-center text-[0.65rem]"
              >
                <i class="fa-solid fa-check"></i>
              </span>
            </div>
            <span class="text-lg font-mono font-bold text-[#083c5a] tracking-wider mb-1">
              {{ b.accountNumber }}
            </span>
            <span class="text-xs text-[#64748b] mb-4">Titular: Mercanto S.A.</span>
            <button
              type="button"
              class="w-full py-2 bg-white border border-[#083c5a] text-[#083c5a] rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#f8fafc] transition-colors mt-auto active:scale-98"
              @click.stop="handleCopyAccount(b.accountNumber, b.id)"
            >
              <i :class="copiedBank === b.id ? 'fa-solid fa-check text-emerald-600' : 'fa-regular fa-copy'"></i>
              <span>{{ copiedBank === b.id ? "¡Copiado!" : "Copiar número" }}</span>
            </button>
          </div>
        </div>

        <h3 class="text-lg font-bold text-[#083c5a] font-serif mb-4">2. Registrá los datos de tu comprobante</h3>
        
        <form class="flex flex-col gap-5 mb-8" @submit.prevent="handleContinue">
          <div class="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <!-- Monto -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-[#083c5a]">Monto depositado *</label>
              <div class="relative">
                <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">C$</span>
                <input
                  v-model.number="amount"
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="0.00"
                  class="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-sm text-[#083c5a] outline-none focus:border-[#189c94] focus:ring-2 focus:ring-[#189c94]/15 font-medium transition-all"
                />
              </div>
            </div>

            <!-- Banco con Reka UI Select -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-[#083c5a]">Banco destino *</label>
              <SelectRoot v-model="selectedBankId">
                <SelectTrigger
                  class="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-[#083c5a] outline-none transition-all hover:bg-slate-50 focus:border-[#189c94] focus:ring-2 focus:ring-[#189c94]/15"
                >
                  <div class="flex items-center gap-2 truncate">
                    <i class="fa-solid fa-building-columns text-xs text-[#189c94]"></i>
                    <SelectValue placeholder="Selecciona un banco" />
                  </div>
                  <SelectIcon>
                    <i class="fa-solid fa-chevron-down text-xs text-slate-400"></i>
                  </SelectIcon>
                </SelectTrigger>
                <SelectPortal>
                  <SelectContent
                    class="z-[15000] min-w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-xl"
                  >
                    <SelectViewport>
                      <SelectItem
                        v-for="b in BANK_OPTIONS"
                        :key="b.id"
                        :value="b.id"
                        class="relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-3 text-xs font-semibold text-slate-700 outline-none hover:bg-[#e6f7f5] hover:text-[#189c94] data-[highlighted]:bg-[#e6f7f5] data-[highlighted]:text-[#189c94]"
                      >
                        <SelectItemIndicator class="absolute left-2.5 inline-flex items-center">
                          <i class="fa-solid fa-check text-xs text-[#189c94]"></i>
                        </SelectItemIndicator>
                        <SelectItemText>{{ b.name }} ({{ b.accountType }})</SelectItemText>
                      </SelectItem>
                    </SelectViewport>
                  </SelectContent>
                </SelectPortal>
              </SelectRoot>
            </div>

            <!-- Número de referencia -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-[#083c5a]">Número de referencia / transferencia *</label>
              <input
                v-model="referenceNumber"
                type="text"
                required
                placeholder="Ej: 12345678"
                class="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm text-[#083c5a] outline-none focus:border-[#189c94] focus:ring-2 focus:ring-[#189c94]/15 transition-all"
              />
            </div>

            <!-- Fecha y Hora de depósito -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-[#083c5a]">Fecha de depósito *</label>
                <input
                  v-model="depositDate"
                  type="date"
                  required
                  class="h-10 w-full border border-slate-200 rounded-xl px-3.5 text-sm text-[#083c5a] outline-none focus:border-[#189c94] focus:ring-2 focus:ring-[#189c94]/15 transition-all bg-white"
                />
              </div>

              <BaseTimeInput
                v-model="depositTime"
                label="Hora del depósito *"
                label-class="text-xs font-bold text-[#083c5a]"
                :hour-cycle="12"
              />
            </div>

            <!-- Titular del depósito -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-[#083c5a]">Nombre del depositante</label>
              <input
                v-model="depositorName"
                type="text"
                placeholder="Ej: Juan Carlos Pérez"
                class="w-full border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm text-[#083c5a] outline-none focus:border-[#189c94] focus:ring-2 focus:ring-[#189c94]/15 transition-all"
              />
            </div>
          </div>

          <!-- BaseFileDropZone component -->
          <div class="flex flex-col gap-1.5 mt-2">
            <label class="text-xs font-bold text-[#083c5a]">Comprobante de depósito *</label>
            <BaseFileDropZone
              v-model="voucherFile"
              :multiple="false"
              accept="image/png, image/jpeg, image/webp, application/pdf"
              :max-size-mb="5"
              title="Sube tu comprobante de depósito"
              button-text="Seleccionar comprobante"
              hint="Formatos aceptados: PNG, JPG, WEBP, PDF (Máx. 5MB)"
              @error="handleDropError"
            />
          </div>

          <div class="flex gap-4 mt-6">
            <button
              type="button"
              class="flex-1 py-3 bg-white border-2 border-[#083c5a] text-[#083c5a] rounded-xl font-bold hover:bg-[#f8fafc] transition-colors flex items-center justify-center gap-2 text-sm"
              @click="router.push({ name: 'wallet' })"
            >
              <i class="fa-solid fa-arrow-left"></i> Volver a la billetera
            </button>
            <button
              type="submit"
              class="flex-1 py-3 bg-[#f97316] text-white rounded-xl font-bold hover:bg-[#ea580c] transition-colors text-sm shadow-md"
            >
              Continuar al paso 2
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

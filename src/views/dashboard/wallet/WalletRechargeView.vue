<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
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

const getBankStyle = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("lafise")) return { iconClass: "bg-[#e6f7f5] text-[#189c94]" };
  if (lower.includes("bac")) return { iconClass: "bg-[#fef2f2] text-[#ef4444]" };
  if (lower.includes("banpro")) return { iconClass: "bg-[#ecfdf5] text-[#059669]" };
  if (lower.includes("ficohsa")) return { iconClass: "bg-[#fffbeb] text-[#d97706]" };
  return { iconClass: "bg-[#f0f9ff] text-[#0284c7]" };
};

const bankAccounts = computed(() => {
  return walletStore.platformBankAccounts.map((account) => ({
    id: account.id,
    name: account.bank_name,
    accountNumber: account.account_number,
    accountType: account.account_type,
    accountHolder: account.account_holder,
    ...getBankStyle(account.bank_name),
  }));
});

const selectedBankId = ref<string>(walletStore.rechargeDraft.platformBankAccountId || "");
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

onMounted(async () => {
  await walletStore.fetchPlatformBankAccounts();
  if (!selectedBankId.value && bankAccounts.value.length > 0) {
    selectedBankId.value = bankAccounts.value[0].id;
  }
});

const currentBank = computed(
  () => bankAccounts.value.find((b) => b.id === selectedBankId.value) || bankAccounts.value[0]
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

  if (!currentBank.value) {
    toastStore.addToast({
      title: "Cuenta bancaria requerida",
      message: "Selecciona una cuenta de destino.",
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

  if (!voucherFile.value) {
    toastStore.addToast({
      title: "Comprobante requerido",
      message: "Debes adjuntar el comprobante o voucher de la transferencia.",
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
    platformBankAccountId: currentBank.value.id,
    bank: currentBank.value.name.toLowerCase().replace(/\s+/g, "-"),
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
        
        <!-- Loading State for Bank Accounts -->
        <div v-if="walletStore.isAccountsLoading" class="grid grid-cols-2 gap-4 mb-8 max-md:grid-cols-1">
          <div v-for="i in 2" :key="i" class="border border-slate-200 rounded-2xl p-5 animate-pulse bg-slate-50 h-36"></div>
        </div>

        <!-- Bank Accounts Grid -->
        <div v-else class="grid grid-cols-2 gap-4 mb-8 max-md:grid-cols-1">
          <div
            v-for="b in bankAccounts"
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
            <span class="text-xs text-[#64748b] mb-4">Titular: {{ b.accountHolder || "Mercanto S.A." }}</span>
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
                    position="popper"
                    :side-offset="4"
                    class="z-50 min-w-(--reka-select-trigger-width) overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg animate-in fade-in-80"
                  >
                    <SelectViewport>
                      <SelectItem
                        v-for="b in bankAccounts"
                        :key="b.id"
                        :value="b.id"
                        class="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#083c5a] outline-none transition-colors hover:bg-[#e6f7f5] hover:text-[#189c94] cursor-pointer"
                      >
                        <SelectItemText>{{ b.name }} ({{ b.accountNumber }})</SelectItemText>
                        <SelectItemIndicator>
                          <i class="fa-solid fa-check text-xs text-[#189c94]"></i>
                        </SelectItemIndicator>
                      </SelectItem>
                    </SelectViewport>
                  </SelectContent>
                </SelectPortal>
              </SelectRoot>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <!-- Número de referencia -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-[#083c5a]">Número de referencia bancaria *</label>
              <input
                v-model="referenceNumber"
                type="text"
                required
                placeholder="Ej. 1234567"
                class="w-full border border-slate-200 rounded-xl py-2 px-3 text-sm text-[#083c5a] outline-none focus:border-[#189c94] focus:ring-2 focus:ring-[#189c94]/15 font-mono font-medium transition-all"
              />
            </div>

            <!-- Nombre de quien depositó -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-[#083c5a]">Nombre del titular que depositó (opcional)</label>
              <input
                v-model="depositorName"
                type="text"
                placeholder="Ej. Juan Pérez"
                class="w-full border border-slate-200 rounded-xl py-2 px-3 text-sm text-[#083c5a] outline-none focus:border-[#189c94] focus:ring-2 focus:ring-[#189c94]/15 font-medium transition-all"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <!-- Fecha de depósito -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-[#083c5a]">Fecha del depósito *</label>
              <div class="relative">
                <input
                  v-model="depositDate"
                  type="date"
                  required
                  class="w-full border border-slate-200 rounded-xl py-2 px-3 text-sm text-[#083c5a] outline-none focus:border-[#189c94] focus:ring-2 focus:ring-[#189c94]/15 font-medium transition-all"
                />
              </div>
            </div>

            <!-- Hora de depósito -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-bold text-[#083c5a]">Hora del depósito</label>
              <BaseTimeInput
                v-model="depositTime"
                placeholder="Selecciona la hora"
              />
            </div>
          </div>

          <!-- Comprobante / Voucher File Dropzone -->
          <div class="flex flex-col gap-1.5 mt-2">
            <label class="text-xs font-bold text-[#083c5a]">Comprobante de transferencia o depósito *</label>
            <BaseFileDropZone
              v-model="voucherFile"
              accept="image/*,application/pdf"
              :max-size-m-b="10"
              upload-text="Arrastra tu comprobante aquí o haz clic para seleccionarlo"
              support-text="Formatos permitidos: PNG, JPG, JPEG o PDF (máx. 10MB)"
              @error="handleDropError"
            />
          </div>

          <!-- Buttons -->
          <div class="flex gap-4 mt-6">
            <button
              type="button"
              class="flex-1 py-3 bg-white border-2 border-[#083c5a] text-[#083c5a] rounded-xl font-bold hover:bg-[#f8fafc] transition-colors flex items-center justify-center gap-2 text-sm"
              @click="router.push({ name: 'wallet' })"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="flex-1 py-3.5 bg-[#f97316] text-white rounded-xl font-bold hover:bg-[#ea580c] transition-colors text-base shadow-md flex items-center justify-center gap-2 active:scale-99"
            >
              <span>Continuar</span>
              <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

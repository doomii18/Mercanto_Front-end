<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "reka-ui";
import type { ProviderPayoutItem } from "@/views/admin/AdminPedidosView.vue";

interface Props {
  open: boolean;
  payout: ProviderPayoutItem | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "confirm", payload: {
    payoutId: string;
    bank: string;
    accountNumber: string;
    accountHolder: string;
    transferNumber: string;
    depositDate: string;
    amount: number;
    voucherFileName: string;
  }): void;
}>();

// Steps
const activeStep = ref<1 | 2 | 3>(1);
const showValidationErrors = ref(false);

// Form Fields
const bank = ref("LAFISE");
const accountNumber = ref("");
const accountHolder = ref("");
const transferNumber = ref("");
const depositDate = ref("");
const depositAmount = ref("");

// Voucher File Upload
const voucherFile = ref<File | null>(null);
const voucherPreviewUrl = ref<string | null>(null);
const voucherFileName = ref("");
const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

// Format numbers
const formatMoney = (val: number) => {
  return val.toLocaleString("es-NI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Available Banks
const BANKS = [
  "LAFISE",
  "BANPRO",
  "BAC Credomatic",
  "BDF",
  "Banco Ficohsa",
  "Avanz",
];

// Field-level validations
const isBankValid = computed(() => Boolean(bank.value?.trim()));
const isAccountNumberValid = computed(() => Boolean(accountNumber.value?.trim() && accountNumber.value.trim().length >= 4));
const isAccountHolderValid = computed(() => Boolean(accountHolder.value?.trim() && accountHolder.value.trim().length >= 2));
const isTransferNumberValid = computed(() => Boolean(transferNumber.value?.trim() && transferNumber.value.trim().length >= 3));
const isDepositDateValid = computed(() => Boolean(depositDate.value?.trim()));
const isDepositAmountValid = computed(() => {
  if (!depositAmount.value?.trim()) return false;
  const num = Number(depositAmount.value.replace(/[^0-9.-]+/g, ""));
  return !isNaN(num) && num > 0;
});
const isVoucherValid = computed(() => Boolean(voucherFileName.value?.trim()));

// Whole form validation
const isFormValid = computed(() => {
  return (
    isBankValid.value &&
    isAccountNumberValid.value &&
    isAccountHolderValid.value &&
    isTransferNumberValid.value &&
    isDepositDateValid.value &&
    isDepositAmountValid.value &&
    isVoucherValid.value
  );
});

// Save capability: STRICTLY ONLY on step 3 and only if form is completely valid
const canSave = computed(() => {
  return activeStep.value === 3 && isFormValid.value;
});

// Initialize form when payout changes
watch(
  () => props.payout,
  (newVal) => {
    if (newVal) {
      activeStep.value = 1;
      showValidationErrors.value = false;
      bank.value = "LAFISE";
      accountHolder.value = newVal.name;
      depositAmount.value = formatMoney(newVal.netAmount);
      depositDate.value = new Date().toLocaleDateString("es-NI", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      // Start empty so user MUST complete all required fields
      accountNumber.value = "";
      transferNumber.value = "";
      voucherFileName.value = "";
      voucherPreviewUrl.value = null;
      voucherFile.value = null;
    }
  },
  { immediate: true }
);


// Included orders codes generator
const includedOrderCodes = computed(() => {
  if (!props.payout) return [];
  const count = props.payout.orderCount || 28;
  const baseId = 245;
  const list: string[] = [];
  for (let i = 0; i < Math.min(count, 5); i++) {
    list.push(`PED-${String(baseId + i).padStart(6, "0")}`);
  }
  return list;
});

const remainingOrdersCount = computed(() => {
  if (!props.payout) return 0;
  return Math.max(0, props.payout.orderCount - includedOrderCodes.value.length);
});

// File upload handlers
function triggerFileInput() {
  fileInputRef.value?.click();
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    processFile(target.files[0]);
  }
}

function handleFileDrop(event: DragEvent) {
  isDragging.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    processFile(event.dataTransfer.files[0]);
  }
}

function processFile(file: File) {
  voucherFile.value = file;
  voucherFileName.value = file.name;
  if (file.type.startsWith("image/")) {
    voucherPreviewUrl.value = URL.createObjectURL(file);
  } else {
    voucherPreviewUrl.value = null;
  }
}

function removeVoucher() {
  voucherFile.value = null;
  voucherPreviewUrl.value = null;
  voucherFileName.value = "";
  if (fileInputRef.value) fileInputRef.value.value = "";
}

// Step navigation
function tryGoToStep(targetStep: 1 | 2 | 3) {
  // STRICT: Cannot jump to step 2 or 3 if step 1 is incomplete!
  if (targetStep > 1 && !isFormValid.value) {
    showValidationErrors.value = true;
    return;
  }
  activeStep.value = targetStep;
}

function handleNextStep() {
  // STRICT: Cannot advance to next step until all fields are complete
  if (!isFormValid.value) {
    showValidationErrors.value = true;
    return;
  }
  if (activeStep.value === 1) {
    activeStep.value = 2;
  } else if (activeStep.value === 2) {
    activeStep.value = 3;
  }
}

// Final Save and Confirmation action
function handleSaveAndMarkPaid() {
  // Guard: ONLY permitted on Step 3 and when form is valid
  if (activeStep.value !== 3) {
    return;
  }
  if (!isFormValid.value) {
    showValidationErrors.value = true;
    activeStep.value = 1;
    return;
  }
  if (!props.payout) return;

  const rawAmount = Number(depositAmount.value.replace(/[^0-9.-]+/g, "")) || props.payout.netAmount;

  emit("confirm", {
    payoutId: props.payout.id,
    bank: bank.value,
    accountNumber: accountNumber.value,
    accountHolder: accountHolder.value,
    transferNumber: transferNumber.value,
    depositDate: depositDate.value,
    amount: rawAmount,
    voucherFileName: voucherFileName.value || "comprobante.jpg",
  });

  emit("update:open", false);
}
</script>

<template>
  <DialogRoot :open="open" @update:open="(val) => emit('update:open', val)">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 animate-in fade-in transition-all" />
      <DialogContent
        class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl sm:max-w-2xl bg-white rounded-2xl shadow-2xl z-50 max-h-[92vh] sm:max-h-[88vh] flex flex-col font-sans overflow-hidden border border-slate-100"
      >
        <!-- Modal Header -->
        <div class="px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-100 shrink-0 bg-white">
          <div class="flex items-center gap-3">
            <DialogTitle class="font-serif text-lg sm:text-xl font-bold text-[#083c5a] tracking-tight">
              Registrar pago a proveedor
            </DialogTitle>
          </div>

          <DialogClose
            class="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <i class="fa-solid fa-xmark text-lg"></i>
          </DialogClose>
        </div>

        <!-- Wizard / Stepper Navigation (Enforced: steps 2 & 3 disabled if step 1 incomplete) -->
        <div class="px-5 sm:px-8 pt-4 pb-3 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div class="flex items-center justify-between max-w-md mx-auto relative">
            <!-- Step 1 -->
            <button
              type="button"
              @click="tryGoToStep(1)"
              class="flex flex-col items-center gap-1.5 z-10 cursor-pointer group"
            >
              <div
                :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all',
                  activeStep === 1
                    ? 'bg-[#00a896] text-white shadow-xs ring-4 ring-teal-100'
                    : isFormValid
                    ? 'bg-teal-50 border-2 border-[#00a896] text-[#00a896]'
                    : 'bg-white border-2 border-slate-300 text-slate-500 group-hover:border-slate-400',
                ]"
              >
                <i v-if="activeStep > 1 && isFormValid" class="fa-solid fa-check text-[10px]"></i>
                <span v-else>1</span>
              </div>
              <span
                :class="[
                  'text-xs font-semibold transition-colors',
                  activeStep === 1 ? 'text-[#083c5a] font-bold' : 'text-slate-400',
                ]"
              >
                Información
              </span>
            </button>

            <!-- Line 1 to 2 -->
            <div
              :class="[
                'h-0.5 flex-1 mx-2 -mt-4 transition-colors',
                activeStep >= 2 ? 'bg-[#00a896]' : isFormValid ? 'bg-slate-300' : 'bg-slate-200',
              ]"
            ></div>

            <!-- Step 2 (Disabled until Step 1 complete) -->
            <button
              type="button"
              :disabled="!isFormValid"
              @click="tryGoToStep(2)"
              :class="[
                'flex flex-col items-center gap-1.5 z-10 group transition-all',
                isFormValid ? 'cursor-pointer' : 'cursor-not-allowed opacity-50 pointer-events-none',
              ]"
              :title="!isFormValid ? 'Completa los campos obligatorios para avanzar' : ''"
            >
              <div
                :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all',
                  activeStep === 2
                    ? 'bg-[#00a896] text-white shadow-xs ring-4 ring-teal-100'
                    : activeStep > 2
                    ? 'bg-teal-50 border-2 border-[#00a896] text-[#00a896]'
                    : isFormValid
                    ? 'bg-white border-2 border-slate-300 text-slate-500 group-hover:border-slate-400'
                    : 'bg-slate-100 border-2 border-slate-200 text-slate-400',
                ]"
              >
                <i v-if="activeStep > 2" class="fa-solid fa-check text-[10px]"></i>
                <span v-else>2</span>
              </div>
              <span
                :class="[
                  'text-xs font-semibold transition-colors',
                  activeStep === 2 ? 'text-[#083c5a] font-bold' : isFormValid ? 'text-slate-500' : 'text-slate-300',
                ]"
              >
                Pedidos
              </span>
            </button>

            <!-- Line 2 to 3 -->
            <div
              :class="[
                'h-0.5 flex-1 mx-2 -mt-4 transition-colors',
                activeStep === 3 ? 'bg-[#00a896]' : isFormValid ? 'bg-slate-300' : 'bg-slate-200',
              ]"
            ></div>

            <!-- Step 3 (Disabled until Step 1 complete) -->
            <button
              type="button"
              :disabled="!isFormValid"
              @click="tryGoToStep(3)"
              :class="[
                'flex flex-col items-center gap-1.5 z-10 group transition-all',
                isFormValid ? 'cursor-pointer' : 'cursor-not-allowed opacity-50 pointer-events-none',
              ]"
              :title="!isFormValid ? 'Completa los campos obligatorios para avanzar' : ''"
            >
              <div
                :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all',
                  activeStep === 3
                    ? 'bg-[#00a896] text-white shadow-xs ring-4 ring-teal-100'
                    : isFormValid
                    ? 'bg-white border-2 border-slate-300 text-slate-500 group-hover:border-slate-400'
                    : 'bg-slate-100 border-2 border-slate-200 text-slate-400',
                ]"
              >
                3
              </div>
              <span
                :class="[
                  'text-xs font-semibold transition-colors',
                  activeStep === 3 ? 'text-[#083c5a] font-bold' : isFormValid ? 'text-slate-500' : 'text-slate-300',
                ]"
              >
                Confirmar
              </span>
            </button>
          </div>
        </div>

        <!-- Scrollable Modal Body -->
        <div class="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          <!-- Mandatory Notice: cannot pass to next step until all fields complete -->
          <div
            v-if="!isFormValid && activeStep === 1"
            class="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-amber-800 flex items-center justify-between gap-2.5 animate-in fade-in"
          >
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-lock text-amber-600 text-sm shrink-0"></i>
              <span class="text-xs font-medium">
                Completa todos los campos obligatorios con asterisco (*) para poder avanzar al siguiente paso.
              </span>
            </div>
          </div>

          <!-- STEP 1: FORM MAIN VIEW (Información) -->
          <template v-if="activeStep === 1 && payout">
            <!-- 1. Información del proveedor -->
            <div class="space-y-3">
              <h3 class="text-sm font-bold text-[#083c5a]">
                1. Información del proveedor
              </h3>

              <div class="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-2xs">
                <!-- Header: Avatar + Name + RUC + Period -->
                <div class="flex items-center gap-3">
                  <div
                    class="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold text-base flex items-center justify-center shrink-0 border border-blue-200/60"
                  >
                    {{ payout.initials }}
                  </div>
                  <div class="min-w-0">
                    <h4 class="font-bold text-sm text-[#083c5a] truncate">
                      {{ payout.name }}
                    </h4>
                    <p class="text-xs text-slate-500 mt-0.5">
                      RUC: <span class="font-mono font-medium">{{ payout.ruc }}</span>
                    </p>
                    <p class="text-[11px] text-slate-400 mt-0.5">
                      {{ payout.orderCount }} pedidos &nbsp;|&nbsp; {{ payout.period }}
                    </p>
                  </div>
                </div>

                <!-- Resumen del pago Box -->
                <div class="rounded-xl bg-[#f0f7fc] border border-blue-100/80 p-3.5 sm:p-4 space-y-2">
                  <h5 class="text-xs font-bold text-[#083c5a]">
                    Resumen del pago
                  </h5>
                  <div class="flex items-center justify-between text-slate-600">
                    <span>Ventas totales &nbsp;(C$)</span>
                    <span class="font-semibold text-slate-800">{{ formatMoney(payout.grossSales) }}</span>
                  </div>
                  <div class="flex items-center justify-between text-slate-600">
                    <span>Comisión 2.5% &nbsp;(C$)</span>
                    <span class="font-semibold text-slate-800">{{ formatMoney(payout.commission) }}</span>
                  </div>
                  <div class="pt-2 border-t border-blue-200/50 flex items-center justify-between">
                    <span class="font-bold text-[#00a896] text-xs sm:text-sm">Monto a pagar (C$)</span>
                    <span class="font-bold font-serif text-base sm:text-lg text-[#00a896]">
                      {{ formatMoney(payout.netAmount) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. Datos del depósito -->
            <div class="space-y-3">
              <h3 class="text-sm font-bold text-[#083c5a]">
                2. Datos del depósito
              </h3>

              <div class="space-y-3">
                <!-- Row 1: Banco & Número de cuenta -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">
                      Banco <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                      <select
                        v-model="bank"
                        :class="[
                          'w-full appearance-none px-3.5 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-800 shadow-2xs focus:outline-none focus:border-[#00a896] pr-8 cursor-pointer',
                          showValidationErrors && !isBankValid ? 'border-red-400 bg-red-50/10' : 'border-slate-200',
                        ]"
                      >
                        <option v-for="b in BANKS" :key="b" :value="b">{{ b }}</option>
                      </select>
                      <i class="fa-solid fa-chevron-down text-[10px] text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                    </div>
                  </div>

                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">
                      Número de cuenta <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="accountNumber"
                      type="text"
                      placeholder="Ej. 1234567890"
                      :class="[
                        'w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-800 shadow-2xs focus:outline-none focus:border-[#00a896]',
                        showValidationErrors && !isAccountNumberValid ? 'border-red-400 bg-red-50/10' : 'border-slate-200',
                      ]"
                    />
                    <p v-if="showValidationErrors && !isAccountNumberValid" class="text-[10px] text-red-500 mt-1 font-medium">
                      <i class="fa-solid fa-circle-exclamation mr-1"></i>El número de cuenta es obligatorio (mínimo 4 dígitos).
                    </p>
                  </div>
                </div>

                <!-- Row 2: Titular de la cuenta -->
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">
                    Titular de la cuenta <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="accountHolder"
                    type="text"
                    placeholder="Nombre o razón social del titular"
                    :class="[
                      'w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-800 shadow-2xs focus:outline-none focus:border-[#00a896]',
                      showValidationErrors && !isAccountHolderValid ? 'border-red-400 bg-red-50/10' : 'border-slate-200',
                    ]"
                  />
                  <p v-if="showValidationErrors && !isAccountHolderValid" class="text-[10px] text-red-500 mt-1 font-medium">
                    <i class="fa-solid fa-circle-exclamation mr-1"></i>El titular de la cuenta es obligatorio.
                  </p>
                </div>

                <!-- Row 3: Número de transferencia & Fecha de depósito -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">
                      Número de transferencia <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="transferNumber"
                      type="text"
                      placeholder="Ej. TRF-987654321"
                      :class="[
                        'w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-800 shadow-2xs focus:outline-none focus:border-[#00a896]',
                        showValidationErrors && !isTransferNumberValid ? 'border-red-400 bg-red-50/10' : 'border-slate-200',
                      ]"
                    />
                    <p v-if="showValidationErrors && !isTransferNumberValid" class="text-[10px] text-red-500 mt-1 font-medium">
                      <i class="fa-solid fa-circle-exclamation mr-1"></i>El número de transferencia es obligatorio.
                    </p>
                  </div>

                  <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">
                      Fecha de depósito <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                      <input
                        v-model="depositDate"
                        type="text"
                        placeholder="07/09/2026"
                        :class="[
                          'w-full pl-9 pr-3.5 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-800 shadow-2xs focus:outline-none focus:border-[#00a896]',
                          showValidationErrors && !isDepositDateValid ? 'border-red-400 bg-red-50/10' : 'border-slate-200',
                        ]"
                      />
                      <i class="fa-regular fa-calendar text-slate-400 text-xs absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                    </div>
                    <p v-if="showValidationErrors && !isDepositDateValid" class="text-[10px] text-red-500 mt-1 font-medium">
                      <i class="fa-solid fa-circle-exclamation mr-1"></i>La fecha de depósito es obligatoria.
                    </p>
                  </div>
                </div>

                <!-- Row 4: Monto depositado (C$) -->
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">
                    Monto depositado (C$) <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="depositAmount"
                    type="text"
                    placeholder="Monto a pagar"
                    :class="[
                      'w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-800 shadow-2xs focus:outline-none focus:border-[#00a896]',
                      showValidationErrors && !isDepositAmountValid ? 'border-red-400 bg-red-50/10' : 'border-slate-200',
                    ]"
                  />
                  <p v-if="showValidationErrors && !isDepositAmountValid" class="text-[10px] text-red-500 mt-1 font-medium">
                    <i class="fa-solid fa-circle-exclamation mr-1"></i>Ingresa un monto depositado válido mayor a 0.
                  </p>
                </div>
              </div>
            </div>

            <!-- 3. Comprobante de pago -->
            <div class="space-y-3">
              <h3 class="text-sm font-bold text-[#083c5a]">
                3. Comprobante de pago <span class="text-red-500">*</span>
              </h3>

              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <!-- Dropzone Area -->
                <div
                  @dragover.prevent="isDragging = true"
                  @dragleave.prevent="isDragging = false"
                  @drop.prevent="handleFileDrop"
                  @click="triggerFileInput"
                  :class="[
                    'flex-1 border-2 border-dashed rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[105px]',
                    isDragging
                      ? 'border-[#00a896] bg-teal-50/50'
                      : showValidationErrors && !isVoucherValid
                      ? 'border-red-400 bg-red-50/20'
                      : 'border-blue-200 bg-white hover:bg-blue-50/20 hover:border-blue-300',
                  ]"
                >
                  <input
                    ref="fileInputRef"
                    type="file"
                    accept="image/*,application/pdf"
                    class="hidden"
                    @change="handleFileChange"
                  />
                  <i class="fa-solid fa-arrow-up-from-bracket text-blue-600 text-xl mb-1.5"></i>
                  <p class="font-medium text-xs text-slate-700">
                    Arrastra y suelta la imagen aquí
                  </p>
                  <p class="text-[11px] text-slate-400">
                    o haz clic para seleccionar
                  </p>
                </div>

                <!-- Uploaded Preview Thumbnail Card -->
                <div class="sm:w-48 rounded-xl border border-slate-200 bg-white p-2.5 flex flex-col justify-between shrink-0 shadow-2xs">
                  <div class="w-full h-20 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200 relative group">
                    <img
                      v-if="voucherPreviewUrl"
                      :src="voucherPreviewUrl"
                      alt="Comprobante"
                      class="w-full h-full object-cover"
                    />
                    <!-- Sample Voucher Thumbnail when file attached -->
                    <div v-else-if="voucherFileName" class="w-full h-full bg-slate-100 p-2 flex flex-col justify-between text-[8px] font-mono text-slate-500 overflow-hidden select-none">
                      <div class="border-b border-slate-300 pb-0.5 font-bold flex justify-between">
                        <span>COMPROBANTE</span>
                        <span>{{ bank }}</span>
                      </div>
                      <div class="space-y-0.5 text-[7px] text-slate-400">
                        <div>REF: {{ transferNumber || "TRF-987654" }}</div>
                        <div>FEC: {{ depositDate || "07/09/2026" }}</div>
                      </div>
                      <div class="font-bold text-slate-600 text-right">C$ {{ depositAmount || "0.00" }}</div>
                    </div>
                    <!-- Empty placeholder if deleted -->
                    <div v-else class="text-slate-400 text-center p-2 flex flex-col items-center justify-center h-full">
                      <i class="fa-regular fa-image text-lg text-slate-300"></i>
                      <p class="text-[10px] text-slate-400 mt-1">Sin archivo</p>
                    </div>
                  </div>

                  <div class="flex items-center justify-between pt-2">
                    <span
                      :class="[
                        'text-[11px] truncate max-w-[120px]',
                        voucherFileName ? 'font-medium text-slate-700' : 'text-slate-400 italic',
                      ]"
                      :title="voucherFileName"
                    >
                      {{ voucherFileName || "Sin archivo adjunto" }}
                    </span>
                    <button
                      v-if="voucherFileName"
                      type="button"
                      @click="removeVoucher"
                      class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer transition-colors"
                      title="Eliminar comprobante"
                    >
                      <i class="fa-solid fa-trash text-xs"></i>
                    </button>
                  </div>
                </div>
              </div>
              <p :class="['text-[11px]', showValidationErrors && !isVoucherValid ? 'text-red-500 font-semibold' : 'text-slate-400']">
                {{ showValidationErrors && !isVoucherValid ? '⚠️ Es obligatorio adjuntar el comprobante o baucher de pago.' : 'Formatos permitidos: JPG, PNG, PDF (Máx. 5 MB)' }}
              </p>
            </div>

            <!-- 4. Pedidos incluidos -->
            <div class="space-y-2.5 pt-1">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-bold text-[#083c5a]">
                  4. Pedidos incluidos
                </h3>
                <button
                  type="button"
                  :disabled="!isFormValid"
                  @click="tryGoToStep(2)"
                  :class="[
                    'text-xs font-semibold',
                    isFormValid ? 'text-blue-600 hover:underline cursor-pointer' : 'text-slate-400 cursor-not-allowed pointer-events-none'
                  ]"
                >
                  Ver todos ({{ payout.orderCount }})
                </button>
              </div>

              <!-- Included order badges -->
              <div class="flex flex-wrap items-center gap-2">
                <span
                  v-for="code in includedOrderCodes"
                  :key="code"
                  class="px-2.5 py-1 rounded-lg bg-blue-50/80 border border-blue-100 text-blue-800 font-mono text-[11px] font-medium"
                >
                  {{ code }}
                </span>
                <button
                  v-if="remainingOrdersCount > 0"
                  type="button"
                  :disabled="!isFormValid"
                  @click="tryGoToStep(2)"
                  :class="[
                    'px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors',
                    isFormValid
                      ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 cursor-pointer'
                      : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed pointer-events-none',
                  ]"
                >
                  + {{ remainingOrdersCount }} pedidos más
                </button>
              </div>
            </div>
          </template>

          <!-- STEP 2: PEDIDOS INCLUIDOS DETALLADOS -->
          <template v-else-if="activeStep === 2 && payout">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-bold text-[#083c5a]">
                    Listado de Pedidos Incluidos ({{ payout.orderCount }})
                  </h3>
                  <p class="text-xs text-slate-400 mt-0.5">
                    Pedidos correspondientes a la liquidación de {{ payout.name }}.
                  </p>
                </div>
                <button
                  type="button"
                  @click="activeStep = 1"
                  class="text-xs font-bold text-[#00a896] hover:underline cursor-pointer"
                >
                  &larr; Volver a Información
                </button>
              </div>

              <div class="rounded-xl border border-slate-200 overflow-hidden">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                    <tr>
                      <th class="py-2.5 px-3">Código Pedido</th>
                      <th class="py-2.5 px-3">Fecha</th>
                      <th class="py-2.5 px-3 text-right">Venta Bruta</th>
                      <th class="py-2.5 px-3 text-right">Comisión</th>
                      <th class="py-2.5 px-3 text-right">Neto</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr
                      v-for="i in Math.min(payout.orderCount, 8)"
                      :key="i"
                      class="hover:bg-slate-50/70"
                    >
                      <td class="py-2.5 px-3 font-mono text-blue-700 font-semibold">
                        PED-{{ String(244 + i).padStart(6, "0") }}
                      </td>
                      <td class="py-2.5 px-3 text-slate-500">
                        {{ depositDate }}
                      </td>
                      <td class="py-2.5 px-3 text-right text-slate-700 font-medium">
                        C$ {{ formatMoney(payout.grossSales / payout.orderCount) }}
                      </td>
                      <td class="py-2.5 px-3 text-right text-slate-500">
                        C$ {{ formatMoney(payout.commission / payout.orderCount) }}
                      </td>
                      <td class="py-2.5 px-3 text-right font-bold text-[#083c5a]">
                        C$ {{ formatMoney(payout.netAmount / payout.orderCount) }}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot class="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colspan="2" class="py-2.5 px-3 text-slate-700">Total Liquidación:</td>
                      <td class="py-2.5 px-3 text-right text-slate-700">C$ {{ formatMoney(payout.grossSales) }}</td>
                      <td class="py-2.5 px-3 text-right text-slate-500">- C$ {{ formatMoney(payout.commission) }}</td>
                      <td class="py-2.5 px-3 text-right text-[#00a896] text-sm font-serif">
                        C$ {{ formatMoney(payout.netAmount) }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </template>

          <!-- STEP 3: RESUMEN FINAL / CONFIRMACIÓN -->
          <template v-else-if="activeStep === 3 && payout">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-bold text-[#083c5a]">
                    Paso 3 de 3: Confirmar Liquidación de Pago
                  </h3>
                  <p class="text-xs text-slate-400 mt-0.5">
                    Verifica minuciosamente los datos antes de marcar este proveedor como pagado.
                  </p>
                </div>
                <button
                  type="button"
                  @click="activeStep = 1"
                  class="text-xs font-bold text-[#00a896] hover:underline cursor-pointer"
                >
                  &larr; Editar datos
                </button>
              </div>

              <div class="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-2xs">
                <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span class="text-slate-500">Proveedor:</span>
                  <strong class="text-slate-800 text-sm">{{ payout.name }}</strong>
                </div>

                <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span class="text-slate-500">Banco y Cuenta de Destino:</span>
                  <span class="font-semibold text-slate-800">{{ bank }} &bull; {{ accountNumber }}</span>
                </div>

                <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span class="text-slate-500">Titular de Cuenta:</span>
                  <span class="font-medium text-slate-800">{{ accountHolder }}</span>
                </div>

                <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span class="text-slate-500">No. Transferencia / Comprobante:</span>
                  <span class="font-mono font-bold text-blue-700">{{ transferNumber }}</span>
                </div>

                <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span class="text-slate-500">Fecha de Depósito:</span>
                  <span class="font-medium text-slate-700">{{ depositDate }}</span>
                </div>

                <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span class="text-slate-500">Archivo de Comprobante:</span>
                  <span class="font-medium text-emerald-700 flex items-center gap-1.5">
                    <i class="fa-solid fa-file-circle-check text-xs"></i>
                    {{ voucherFileName }}
                  </span>
                </div>

                <div class="flex items-center justify-between pt-1">
                  <span class="text-sm font-bold text-[#083c5a]">Monto Total Liquidado:</span>
                  <span class="text-xl font-bold font-serif text-[#00a896]">
                    C$ {{ depositAmount }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Modal Footer Actions: Adapted per Step (STRICTLY CANNOT ADVANCE IF INCOMPLETE) -->
        <div class="p-4 sm:p-5 bg-white border-t border-slate-100 shrink-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <!-- Left Button -->
          <button
            v-if="activeStep === 1"
            type="button"
            @click="emit('update:open', false)"
            class="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer text-center"
          >
            Cancelar
          </button>
          <button
            v-else-if="activeStep === 2"
            type="button"
            @click="activeStep = 1"
            class="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer text-center"
          >
            &larr; Volver a Información
          </button>
          <button
            v-else
            type="button"
            @click="activeStep = 2"
            class="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer text-center"
          >
            &larr; Volver a Pedidos
          </button>

          <!-- Right Action Button (Step 1 button disabled and locked until complete!) -->
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <!-- Step 1 Button: Siguiente a Pedidos (Bloqueado hasta completar campos) -->
            <button
              v-if="activeStep === 1"
              type="button"
              :disabled="!isFormValid"
              @click="handleNextStep"
              :class="[
                'w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2',
                isFormValid
                  ? 'bg-[#00a896] hover:bg-[#009282] text-white cursor-pointer active:scale-98'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed pointer-events-none opacity-60',
              ]"
              :title="!isFormValid ? 'No puedes pasar al siguiente paso hasta que los campos obligatorios estén completos' : ''"
            >
              <span>Continuar a Pedidos</span>
              <i class="fa-solid fa-arrow-right text-xs"></i>
            </button>

            <!-- Step 2 Button: Siguiente a Confirmar -->
            <button
              v-else-if="activeStep === 2"
              type="button"
              @click="handleNextStep"
              class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#00a896] hover:bg-[#009282] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continuar a Confirmar</span>
              <i class="fa-solid fa-arrow-right text-xs"></i>
            </button>

            <!-- Step 3 Button: Guardar y marcar como pagado (Únicamente en Paso 3 y válido) -->
            <button
              v-else-if="activeStep === 3"
              type="button"
              :disabled="!canSave"
              @click="handleSaveAndMarkPaid"
              :class="[
                'w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2',
                canSave
                  ? 'bg-[#f95738] hover:bg-[#ea4828] active:bg-[#d63d1e] text-white cursor-pointer'
                  : 'bg-slate-300 text-slate-500 opacity-60 cursor-not-allowed pointer-events-none',
              ]"
              :title="!canSave ? 'Completa todos los campos requeridos en el paso 1' : ''"
            >
              <i class="fa-solid fa-check text-sm"></i>
              <span>Guardar y marcar como pagado</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

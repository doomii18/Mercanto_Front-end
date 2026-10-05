<script setup lang="ts">
import { ref } from "vue";

export interface BankRechargeItem {
  bank: string;
  amount: string;
  value: number;
  color: string;
}

const props = withDefaults(
  defineProps<{
    period?: string;
  }>(),
  {
    period: "Este mes",
  }
);

// Self-contained mock data (ready to fetch from API)
const bankData = ref<BankRechargeItem[]>([
  { bank: "BDF",     amount: "C$2.3M", value: 100, color: "#023859" },
  { bank: "BAC",     amount: "C$1.8M", value:  78, color: "#00a896" },
  { bank: "Bangro",  amount: "C$900K", value:  39, color: "#f97316" },
  { bank: "LAFISE",  amount: "C$720K", value:  31, color: "#3b82f6" },
  { bank: "Ficohsa", amount: "C$540K", value:  23, color: "#a855f7" },
]);
</script>

<template>
  <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-800">Recargas por banco</h3>
      <span class="text-[11px] font-semibold text-slate-400">{{ props.period }}</span>
    </div>

    <!-- Bar Chart -->
    <div class="flex items-end gap-3 justify-around h-40 pt-4">
      <div
        v-for="bar in bankData"
        :key="bar.bank"
        class="flex flex-col items-center gap-1.5 flex-1"
      >
        <span class="text-[10px] font-bold text-slate-600 whitespace-nowrap">{{ bar.amount }}</span>
        <div
          class="w-full rounded-t-lg transition-all duration-500"
          :style="{ height: `${(bar.value / 100) * 100}px`, background: bar.color }"
        ></div>
        <span class="text-[10px] font-semibold text-slate-500">{{ bar.bank }}</span>
      </div>
    </div>
  </div>
</template>

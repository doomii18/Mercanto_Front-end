<script setup lang="ts">
import { ref } from "vue";
import MockDepositApproved from "./MockDepositApproved.vue";
import MockDepositRejected from "./MockDepositRejected.vue";

const activeStatus = ref<"approved" | "rejected">("approved");
</script>

<template>
  <div class="flex-1 min-h-0 flex flex-col bg-[#f8fafc] overflow-hidden">
    <!-- Sub-tab switcher to preview both approved and rejected receipts -->
    <div class="flex items-center justify-center gap-2 py-2 px-4 bg-white border-b border-[#eee] shrink-0 text-xs">
      <span class="text-slate-500 font-medium mr-1">Estado del comprobante:</span>
      <button
        type="button"
        class="px-3 py-1 rounded-full font-semibold transition-all cursor-pointer"
        :class="
          activeStatus === 'approved'
            ? 'bg-[#189c94] text-white shadow-sm'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        "
        @click="activeStatus = 'approved'"
      >
        Aprobado
      </button>
      <button
        type="button"
        class="px-3 py-1 rounded-full font-semibold transition-all cursor-pointer"
        :class="
          activeStatus === 'rejected'
            ? 'bg-[#ef4444] text-white shadow-sm'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        "
        @click="activeStatus = 'rejected'"
      >
        Rechazado
      </button>
    </div>

    <!-- Active Mock Receipt View -->
    <MockDepositApproved v-if="activeStatus === 'approved'" />
    <MockDepositRejected v-else />
  </div>
</template>

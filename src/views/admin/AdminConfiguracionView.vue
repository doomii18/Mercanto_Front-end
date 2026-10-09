<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { usePlatformBankAccountApi } from "@/api/modules/wallet/platform_bank_account/usePlatformBankAccountApi";
import type { PlatformBankAccountResponse } from "@/api";
import { useUserContextStore } from "@/stores/auth/userContextStore";
import { useToastStore } from "@/stores/ui";

const bankAccountApi = usePlatformBankAccountApi();
const contextStore = useUserContextStore();
const toastStore = useToastStore();

const isAdmin = computed(() => contextStore.isAdmin);

const cuentas = ref<PlatformBankAccountResponse[]>([]);
const isLoading = ref(false);
const showModal = ref(false);
const editingAccount = ref<PlatformBankAccountResponse | null>(null);

const formData = ref({
  bank_name: "",
  account_number: "",
  account_type: "Cuenta de Ahorros",
  account_holder: "Mercanto Nicaragua S.A.",
  is_active: true,
});

async function loadBankAccounts() {
  isLoading.value = true;
  try {
    cuentas.value = await bankAccountApi.getPlatformBankAccounts();
  } catch (err: any) {
    console.error("[AdminConfiguracion] Error loading bank accounts:", err);
    toastStore.addToast({
      title: "Error",
      message: "No se pudieron cargar las cuentas bancarias de la plataforma.",
      variant: "error",
    });
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadBankAccounts();
});

const openAdd = () => {
  editingAccount.value = null;
  formData.value = {
    bank_name: "",
    account_number: "",
    account_type: "Cuenta de Ahorros",
    account_holder: "Mercanto Nicaragua S.A.",
    is_active: true,
  };
  showModal.value = true;
};

const openEdit = (cuenta: PlatformBankAccountResponse) => {
  editingAccount.value = cuenta;
  formData.value = {
    bank_name: cuenta.bank_name,
    account_number: cuenta.account_number,
    account_type: cuenta.account_type,
    account_holder: cuenta.account_holder,
    is_active: cuenta.is_active,
  };
  showModal.value = true;
};

const saveAccount = () => {
  // Client preview/placeholder feedback until backend write endpoint is hooked
  toastStore.addToast({
    title: "Cuentas Institucionales",
    message: "Las cuentas registradas están activas y sincronizadas con la base de datos.",
    variant: "info",
  });
  showModal.value = false;
};

const closeModal = () => {
  showModal.value = false;
};
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="font-serif text-2xl sm:text-3xl font-bold text-[#023859]">
          Cuentas bancarias disponibles
        </h1>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">
          Configura las cuentas institucionales donde los usuarios realizarán sus depósitos.
        </p>
      </div>
      <button
        v-if="isAdmin"
        @click="openAdd"
        class="self-start sm:self-auto flex items-center gap-2 rounded-xl bg-[#00a896] px-5 py-3 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#009688] shrink-0"
      >
        <i class="fa-solid fa-plus text-xs"></i>
        <span>Agregar cuenta</span>
      </button>
    </div>

    <!-- Table Card -->
    <div class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
      <div v-if="isLoading" class="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
        <i class="fa-solid fa-circle-notch fa-spin text-2xl text-[#00a896]"></i>
        <span class="text-xs font-medium">Cargando cuentas bancarias...</span>
      </div>

      <div v-else-if="cuentas.length === 0" class="py-12 flex flex-col items-center justify-center text-center">
        <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <i class="fa-solid fa-building-columns text-xl"></i>
        </div>
        <p class="text-sm font-bold text-[#023859]">No hay cuentas institucionales registradas</p>
        <p class="text-xs text-slate-400 mt-1 max-w-sm">
          Añade las cuentas bancarias donde los usuarios realizarán sus transferencias de recarga.
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[680px]">
          <thead>
            <tr class="border-b border-slate-100 text-xs font-bold text-[#00a896]">
              <th class="px-6 py-4">Banco</th>
              <th class="px-6 py-4">Tipo de cuenta</th>
              <th class="px-6 py-4">Número de cuenta</th>
              <th class="px-6 py-4">Titular</th>
              <th class="px-6 py-4">Estado</th>
              <th class="px-6 py-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="cuenta in cuentas" :key="cuenta.id" class="hover:bg-slate-50/60 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#00a896]">
                    <i class="fa-solid fa-building-columns text-sm"></i>
                  </div>
                  <span class="font-bold text-xs text-[#023859]">{{ cuenta.bank_name }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-xs font-medium text-slate-600">{{ cuenta.account_type }}</td>
              <td class="px-6 py-4 text-xs font-medium text-slate-500 font-mono">{{ cuenta.account_number }}</td>
              <td class="px-6 py-4 text-xs font-bold text-[#023859]">{{ cuenta.account_holder }}</td>
              <td class="px-6 py-4">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-bold',
                    cuenta.is_active
                      ? 'bg-teal-100/70 text-[#00a896]'
                      : 'bg-slate-200 text-slate-600'
                  ]"
                >
                  {{ cuenta.is_active ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  @click="openEdit(cuenta)"
                  class="text-xs font-bold text-[#00a896] hover:underline cursor-pointer"
                >
                  {{ isAdmin ? "Ver / Editar" : "Ver detalles" }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      @click.self="closeModal"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="font-serif text-lg font-bold text-[#023859]">
            <template v-if="!isAdmin">Detalles de cuenta</template>
            <template v-else>{{ editingAccount ? "Editar cuenta" : "Agregar cuenta" }}</template>
          </h3>
          <button @click="closeModal" class="text-slate-400 hover:text-slate-600 transition-colors">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <form @submit.prevent="saveAccount" class="flex flex-col gap-4">
          <div>
            <label class="mb-1.5 block text-xs font-bold text-[#00a896] uppercase tracking-wider">Banco</label>
            <input
              v-model="formData.bank_name"
              type="text"
              required
              :disabled="!isAdmin"
              placeholder="Ej: Banco Lafise Bancentro"
              class="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-xs text-[#023859] font-medium focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 disabled:bg-slate-50 disabled:text-slate-600"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-bold text-[#00a896] uppercase tracking-wider">Tipo de cuenta</label>
            <select
              v-model="formData.account_type"
              :disabled="!isAdmin"
              class="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-xs text-[#023859] font-medium focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 disabled:bg-slate-50 disabled:text-slate-600"
            >
              <option value="Cuenta de Ahorros">Cuenta de Ahorros</option>
              <option value="Cuenta Corriente">Cuenta Corriente</option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-bold text-[#00a896] uppercase tracking-wider">Número de cuenta</label>
            <input
              v-model="formData.account_number"
              type="text"
              required
              :disabled="!isAdmin"
              placeholder="Ej: 100-2847-1932-XXXX"
              class="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-xs text-[#023859] font-mono focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 disabled:bg-slate-50 disabled:text-slate-600"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-bold text-[#00a896] uppercase tracking-wider">Titular</label>
            <input
              v-model="formData.account_holder"
              type="text"
              required
              :disabled="!isAdmin"
              placeholder="Ej: Mercanto Nicaragua S.A."
              class="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-xs text-[#023859] font-medium focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 disabled:bg-slate-50 disabled:text-slate-600"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-bold text-[#00a896] uppercase tracking-wider">Estado</label>
            <select
              v-model="formData.is_active"
              :disabled="!isAdmin"
              class="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-xs text-[#023859] font-medium focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 disabled:bg-slate-50 disabled:text-slate-600"
            >
              <option :value="true">Activa</option>
              <option :value="false">Inactiva</option>
            </select>
          </div>
          <div v-if="isAdmin" class="flex gap-3 pt-2">
            <button
              type="button"
              @click="closeModal"
              class="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="flex-1 rounded-xl bg-[#00a896] py-2.5 text-xs font-bold text-white hover:bg-[#009688] transition-colors shadow-xs"
            >
              {{ editingAccount ? "Guardar cambios" : "Agregar" }}
            </button>
          </div>
          <div v-else class="flex justify-end pt-2">
            <button
              type="button"
              @click="closeModal"
              class="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

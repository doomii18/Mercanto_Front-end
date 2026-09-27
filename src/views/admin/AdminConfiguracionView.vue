<script setup lang="ts">
import { ref } from "vue";

const showModal = ref(false);
const editingAccount = ref<null | typeof cuentas.value[0]>(null);

const cuentas = ref([
  {
    id: 1,
    banco: "Banco Lafise Bancentro",
    numero: "100-2847-1932-XXXX",
    titular: "Mercanto Nicaragua S.A.",
    estado: "Activo",
  },
  {
    id: 2,
    banco: "BAC Credomatic",
    numero: "362-9481-9923-XXXX",
    titular: "Mercanto Nicaragua S.A.",
    estado: "Activo",
  },
  {
    id: 3,
    banco: "Banpro Grupo Promerica",
    numero: "992-1845-8812-XXXX",
    titular: "Mercanto Nicaragua S.A.",
    estado: "Activo",
  },
]);

const formData = ref({ banco: "", numero: "", titular: "", estado: "Activo" });

const openAdd = () => {
  editingAccount.value = null;
  formData.value = { banco: "", numero: "", titular: "", estado: "Activo" };
  showModal.value = true;
};

const openEdit = (cuenta: typeof cuentas.value[0]) => {
  editingAccount.value = cuenta;
  formData.value = { banco: cuenta.banco, numero: cuenta.numero, titular: cuenta.titular, estado: cuenta.estado };
  showModal.value = true;
};

const saveAccount = () => {
  if (editingAccount.value) {
    const idx = cuentas.value.findIndex(c => c.id === editingAccount.value!.id);
    if (idx !== -1) {
      cuentas.value[idx] = { ...cuentas.value[idx], ...formData.value };
    }
  } else {
    cuentas.value.push({
      id: Date.now(),
      banco: formData.value.banco,
      numero: formData.value.numero,
      titular: formData.value.titular,
      estado: formData.value.estado,
    });
  }
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
        @click="openAdd"
        class="self-start sm:self-auto flex items-center gap-2 rounded-xl bg-[#00a896] px-5 py-3 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#009688] shrink-0"
      >
        <i class="fa-solid fa-plus text-xs"></i>
        <span>Agregar cuenta</span>
      </button>
    </div>

    <!-- Table Card -->
    <div class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[680px]">
          <thead>
            <tr class="border-b border-slate-100 text-xs font-bold text-[#00a896]">
              <th class="px-6 py-4">Banco</th>
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
                  <span class="font-bold text-xs text-[#023859]">{{ cuenta.banco }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-xs font-medium text-slate-500 font-mono">{{ cuenta.numero }}</td>
              <td class="px-6 py-4 text-xs font-bold text-[#023859]">{{ cuenta.titular }}</td>
              <td class="px-6 py-4">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-bold',
                    cuenta.estado === 'Activo'
                      ? 'bg-teal-100/70 text-[#00a896]'
                      : 'bg-slate-200 text-slate-600'
                  ]"
                >
                  {{ cuenta.estado }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  @click="openEdit(cuenta)"
                  class="text-xs font-bold text-[#00a896] hover:underline"
                >
                  Editar
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
            {{ editingAccount ? "Editar cuenta" : "Agregar cuenta" }}
          </h3>
          <button @click="closeModal" class="text-slate-400 hover:text-slate-600 transition-colors">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <form @submit.prevent="saveAccount" class="flex flex-col gap-4">
          <div>
            <label class="mb-1.5 block text-xs font-bold text-[#00a896] uppercase tracking-wider">Banco</label>
            <input
              v-model="formData.banco"
              type="text"
              required
              placeholder="Ej: Banco Lafise Bancentro"
              class="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-xs text-[#023859] font-medium focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-bold text-[#00a896] uppercase tracking-wider">Número de cuenta</label>
            <input
              v-model="formData.numero"
              type="text"
              required
              placeholder="Ej: 100-2847-1932-XXXX"
              class="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-xs text-[#023859] font-mono focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-bold text-[#00a896] uppercase tracking-wider">Titular</label>
            <input
              v-model="formData.titular"
              type="text"
              required
              placeholder="Ej: Mercanto Nicaragua S.A."
              class="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-xs text-[#023859] font-medium focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-bold text-[#00a896] uppercase tracking-wider">Estado</label>
            <select
              v-model="formData.estado"
              class="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-xs text-[#023859] font-medium focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15"
            >
              <option>Activo</option>
              <option>Inactivo</option>
            </select>
          </div>
          <div class="flex gap-3 pt-2">
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
        </form>
      </div>
    </div>
  </div>
</template>

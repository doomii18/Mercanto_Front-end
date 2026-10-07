<script setup lang="ts">
import { computed } from "vue";
import { useUserContextStore } from "@/stores/auth";
import type { OrganizationVerificationStatus } from "@/stores/auth/userContextStore";

const props = defineProps<{
  status?: OrganizationVerificationStatus | string | null;
}>();

const userContext = useUserContextStore();

const activeStatus = computed<OrganizationVerificationStatus | null>(() => {
  if (props.status) return props.status as OrganizationVerificationStatus;
  return userContext.organizationStatus;
});

const bannerConfig = computed(() => {
  switch (activeStatus.value) {
    case "pending":
      return {
        variant: "amber",
        icon: "fa-solid fa-clock-rotate-left",
        title: "Empresa en Proceso de Verificación",
        message:
          "Tu solicitud ha sido enviada y está siendo revisada por el equipo administrativo de Mercanto. Durante este período la publicación y edición de productos en el catálogo se encuentra temporalmente en pausa.",
        tag: "Revisión Pendiente",
        containerClasses: "border-amber-200 bg-amber-50/80 text-amber-950",
        iconBoxClasses: "bg-amber-100 text-amber-600",
        tagClasses: "bg-amber-100 text-amber-800 border-amber-300",
      };
    case "revoked":
      return {
        variant: "rose",
        icon: "fa-solid fa-triangle-exclamation",
        title: "Verificación de Empresa Suspendida",
        message:
          "La verificación de tu organización ha sido suspendida o revocada por un administrador. Todos tus productos han sido pausados automáticamente y la publicación está deshabilitada. Ponte en contacto con soporte para regularizar tu cuenta.",
        tag: "Cuenta Suspendida",
        containerClasses: "border-rose-300 bg-rose-50/90 text-rose-950",
        iconBoxClasses: "bg-rose-100 text-rose-600",
        tagClasses: "bg-rose-100 text-rose-800 border-rose-300",
      };
    case "rejected":
      return {
        variant: "red",
        icon: "fa-solid fa-circle-exclamation",
        title: "Solicitud de Verificación Rechazada",
        message:
          "Tu solicitud de verificación no fue aprobada por el administrador debido a inconsistencias en la información o documentos adjuntos. Revisa los datos de tu empresa para solicitar una nueva evaluación.",
        tag: "Requiere Corrección",
        containerClasses: "border-red-200 bg-red-50/80 text-red-950",
        iconBoxClasses: "bg-red-100 text-red-600",
        tagClasses: "bg-red-100 text-red-800 border-red-300",
      };
    case "draft":
    default:
      return {
        variant: "orange",
        icon: "fa-solid fa-shield-halved",
        title: "Verificación de Empresa Requerida",
        message:
          "Para publicar productos en el catálogo mayorista y recibir cotizaciones, tu organización debe completar la solicitud de verificación legal con sus documentos comerciales.",
        tag: "No Verificado",
        containerClasses: "border-orange-200 bg-orange-50/80 text-orange-950",
        iconBoxClasses: "bg-orange-100 text-orange-600",
        tagClasses: "bg-orange-100 text-orange-800 border-orange-300",
      };
  }
});
</script>

<template>
  <div
    v-if="activeStatus && activeStatus !== 'approved'"
    :class="[
      'relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border p-4 sm:p-5 shadow-xs transition-all',
      bannerConfig.containerClasses
    ]"
    role="alert"
    aria-live="polite"
  >
    <div class="flex items-start gap-3.5 flex-1 min-w-0">
      <div
        :class="[
          'flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl text-lg sm:text-xl shadow-2xs',
          bannerConfig.iconBoxClasses
        ]"
      >
        <i :class="bannerConfig.icon"></i>
      </div>
      <div class="flex flex-col gap-1 min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="text-sm sm:text-base font-bold tracking-tight">
            {{ bannerConfig.title }}
          </h2>
          <span
            :class="[
              'inline-flex items-center text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border',
              bannerConfig.tagClasses
            ]"
          >
            {{ bannerConfig.tag }}
          </span>
        </div>
        <p class="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-3xl">
          {{ bannerConfig.message }}
        </p>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2 self-stretch sm:self-auto shrink-0 mt-1 sm:mt-0">
      <router-link
        :to="{ name: 'profile' }"
        class="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs no-underline w-full sm:w-auto"
      >
        <i class="fa-solid fa-building"></i>
        <span>Ver perfil de empresa</span>
      </router-link>
    </div>
  </div>
</template>

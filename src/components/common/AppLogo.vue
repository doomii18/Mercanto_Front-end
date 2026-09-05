<script setup lang="ts">
import { computed } from "vue";
import logoVariantOne from "@/assets/LOGO.png";
import logoVariantTwo from "@/assets/1.1 Imagotipo variacion.png";

type LogoVariant = "logo" | "imagotipo";

interface Props {
  variant?: LogoVariant;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "logo",
});

const LOGO_MAP: Record<LogoVariant, string> = {
  logo: logoVariantOne,
  imagotipo: logoVariantTwo,
};

const logoSrc = computed(() => LOGO_MAP[props.variant]);
</script>

<template>
  <router-link
    :to="{ name: 'home' }"
    class="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-[--primary-orange] rounded transition-transform hover:scale-[1.03]"
    aria-label="Ir a Mercanto - Inicio"
  >
    <img
      :src="logoSrc"
      alt="Mercanto"
      class="h-full w-auto object-contain pointer-events-none select-none"
      draggable="false"
    />
  </router-link>
</template>

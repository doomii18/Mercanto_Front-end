<script setup lang="ts">
import { computed } from "vue";
import logoImg from "@/assets/logo.png";
import imagotipoImg from "@/assets/1.1 Imagotipo variacion.png";

interface Props {

  variant?: "logo" | "imagotipo";
}

const props = withDefaults(defineProps<Props>(), {
  variant: "logo",
});

const imageSrc = computed(() =>
  props.variant === "imagotipo" ? imagotipoImg : logoImg
);
</script>

<template>
  <router-link
    :to="{ name: 'home' }"
    class="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-[--primary-orange] rounded transition-transform hover:scale-[1.03]"
    aria-label="Ir a Mercanto - Inicio"
  >
    <img
      :src="imageSrc"
      alt="Mercanto"
      class="h-full w-auto object-contain pointer-events-none select-none"
      draggable="false"
    />
  </router-link>
</template>

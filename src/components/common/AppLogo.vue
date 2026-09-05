<script setup lang="ts">

import logoImg from "@/assets/LOGO.png";


interface Props {

  variant?: "logo" | "imagotipo";
}

const props = withDefaults(defineProps<Props>(), {
  variant: "logo",
});


</script>

<template>
  <router-link
    :to="{ name: 'home' }"
    class="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-[--primary-orange] rounded transition-transform hover:scale-[1.03]"
    aria-label="Ir a Mercanto - Inicio"
  >
    <img
      :src="logoImg"
      alt="Mercanto"
      class="h-full w-auto object-contain pointer-events-none select-none"
      draggable="false"
    />
  </router-link>
</template>

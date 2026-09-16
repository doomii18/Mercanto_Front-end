<script setup lang="ts">
import { useCycleList, useIntervalFn } from '@vueuse/core';
import HomeHeroSection from './HomeHeroSection.vue';
import FeaturedProviderSection from './FeaturedProviderSection.vue';
import OffersSection from './OffersSection.vue';

const slides = [HomeHeroSection, FeaturedProviderSection, OffersSection];
const { state: currentSlide, index: activeIndex, next, go } = useCycleList(slides);

const { pause, resume } = useIntervalFn(
  () => {
    next();
  },
  15000,
  { immediate: true }
);

const setSlide = (targetIndex: number) => {
  go(targetIndex);
  resume();
};
</script>
<template>
  <section
    class="relative w-full overflow-hidden bg-neutral-50"
    @mouseenter="pause"
    @mouseleave="resume"
    aria-roledescription="carousel"
  >
    <div class="grid w-full grid-cols-1 grid-rows-1 min-h-150 lg:min-h-175" aria-live="polite">
      <transition name="crossfade">
        <component
          :is="currentSlide"
          :key="activeIndex"
          class="col-start-1 row-start-1 h-full w-full self-stretch"
        />
      </transition>
    </div>
    <div class="absolute bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2">
      <button
        v-for="(_, index) in slides"
        :key="index"
        @click="setSlide(index)"
        :aria-label="`Ir al slide ${index + 1}`"
        :class="[
          'h-3 cursor-pointer rounded-full border-none transition-all duration-300 ease-in-out',
          activeIndex === index ? 'w-8 bg-(--primary-orange)' : 'w-3 bg-neutral-300 hover:bg-neutral-400'
        ]"
      ></button>
    </div>
  </section>
</template>

<style scoped>
.crossfade-enter-active,
.crossfade-leave-active {
  transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
  will-change: opacity, transform;
}
.crossfade-enter-from {
  opacity: 0;
  transform: scale(0.98);
}
.crossfade-leave-to {
  opacity: 0;
  transform: scale(1.02);
}
</style>

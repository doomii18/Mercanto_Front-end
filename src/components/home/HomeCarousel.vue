<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import HomeHeroSection from './HomeHeroSection.vue';
import FeaturedProviderSection from './FeaturedProviderSection.vue';
import OffersSection from './OffersSection.vue';

const slides = [HomeHeroSection, FeaturedProviderSection, OffersSection];
const activeIndex = ref(0);
const intervalTime = 15000;
let timer: number | undefined;

const nextSlide = () => {
  activeIndex.value = (activeIndex.value + 1) % slides.length;
};

const setSlide = (index: number) => {
  activeIndex.value = index;
  resetTimer();
};

const startTimer = () => {
  timer = window.setInterval(nextSlide, intervalTime);
};

const resetTimer = () => {
  clearInterval(timer);
  startTimer();
};

const pauseTimer = () => clearInterval(timer);
const resumeTimer = () => startTimer();

onMounted(() => startTimer());
onUnmounted(() => clearInterval(timer));
</script>

<template>
  <section
    class="relative w-full overflow-hidden bg-slate-50"
    @mouseenter="pauseTimer"
    @mouseleave="resumeTimer"
    aria-roledescription="carousel"
  >
    <!-- CSS Grid Stack Pattern: Forces all children to occupy the exact same cell for seamless crossfading -->
    <div class="grid grid-cols-1 grid-rows-1 w-full min-h-[600px] lg:min-h-[700px]" aria-live="polite">
      <transition name="crossfade">
        <component
          :is="slides[activeIndex]"
          :key="activeIndex"
          class="col-start-1 row-start-1 w-full h-full self-stretch"
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
          activeIndex === index ? 'w-8 bg-[#ff6a00]' : 'w-3 bg-gray-300 hover:bg-gray-400'
        ]"
      ></button>
    </div>
  </section>
</template>

<style scoped>
/* Hardware-accelerated crossfade transitions */
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

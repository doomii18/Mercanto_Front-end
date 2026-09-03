<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import HomeHeroSection from './HomeHeroSection.vue';
import FeaturedProviderSection from './FeaturedProviderSection.vue';
import OffersSection from './OffersSection.vue';

const slides = [HomeHeroSection, FeaturedProviderSection, OffersSection];
const activeIndex = ref(0);
const intervalTime = 15000; // Incrementado a 15 segundos
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
    class="relative w-full overflow-hidden"
    @mouseenter="pauseTimer"
    @mouseleave="resumeTimer"
    aria-roledescription="carousel"
  >
    <div class="relative w-full min-h-[600px]">
      <transition name="fade" mode="out-in">
        <component :is="slides[activeIndex]" :key="activeIndex" />
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease-in-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<script setup lang="ts">
import { ref, provide, onMounted, onUnmounted, markRaw } from 'vue';
import { useCycleList } from '@vueuse/core';
import HomeHeroSection from './HomeHeroSection.vue';
import FeaturedProviderSection from './FeaturedProviderSection.vue';
import OffersSection from './OffersSection.vue';

const slides = [markRaw(HomeHeroSection), markRaw(FeaturedProviderSection), markRaw(OffersSection)];
const { state: currentSlide, index: activeIndex, next, go } = useCycleList(slides);

const SLIDE_INTERVAL_MS = 15000;
const RESUME_GRACE_MS = 6000;

const isHovered = ref(false);
const isFocused = ref(false);
const isSuspended = ref(false); // E.g., user is typing in search bar or dropdown is open

let intervalTimer: ReturnType<typeof setInterval> | null = null;
let resumeTimer: ReturnType<typeof setTimeout> | null = null;

function canAutoRotate(): boolean {
  if (isHovered.value || isFocused.value || isSuspended.value) {
    return false;
  }
  // Check if any input element inside the carousel is currently focused
  const activeEl = document.activeElement;
  if (
    activeEl &&
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) &&
    document.querySelector('.home-carousel-container')?.contains(activeEl)
  ) {
    return false;
  }
  // Check if a search dropdown is open in the DOM
  const dropdown = document.querySelector('.hero-search-dropdown');
  if (dropdown && window.getComputedStyle(dropdown).display !== 'none') {
    return false;
  }
  return true;
}

function startInterval() {
  stopInterval();
  intervalTimer = setInterval(() => {
    if (canAutoRotate()) {
      next();
    }
  }, SLIDE_INTERVAL_MS);
}

function stopInterval() {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
  }
}

function pause() {
  stopInterval();
  if (resumeTimer) {
    clearTimeout(resumeTimer);
    resumeTimer = null;
  }
}

function scheduleResume(delayMs = RESUME_GRACE_MS) {
  if (resumeTimer) {
    clearTimeout(resumeTimer);
  }
  resumeTimer = setTimeout(() => {
    if (canAutoRotate()) {
      startInterval();
    }
  }, delayMs);
}

function handleMouseEnter() {
  isHovered.value = true;
  pause();
}

function handleMouseLeave() {
  isHovered.value = false;
  scheduleResume(3000);
}

function handleFocusIn() {
  isFocused.value = true;
  pause();
}

function handleFocusOut(event: FocusEvent) {
  const container = document.querySelector('.home-carousel-container');
  if (container && event.relatedTarget && container.contains(event.relatedTarget as Node)) {
    return;
  }
  isFocused.value = false;
  scheduleResume(RESUME_GRACE_MS);
}

function handleUserActivity() {
  pause();
  scheduleResume(RESUME_GRACE_MS);
}

function setSuspended(val: boolean) {
  isSuspended.value = val;
  if (val) {
    pause();
  } else {
    scheduleResume(3000);
  }
}

function setSlide(targetIndex: number) {
  go(targetIndex);
  pause();
  scheduleResume(SLIDE_INTERVAL_MS);
}

provide('homeCarousel', {
  pause,
  resume: () => scheduleResume(3000),
  setSuspended,
  handleUserActivity,
});

onMounted(() => {
  startInterval();
});

onUnmounted(() => {
  stopInterval();
  if (resumeTimer) {
    clearTimeout(resumeTimer);
    resumeTimer = null;
  }
});
</script>

<template>
  <section
    class="home-carousel-container relative w-full overflow-hidden bg-neutral-50"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
    @touchstart.passive="handleMouseEnter"
    @touchend.passive="handleMouseLeave"
    @click="handleUserActivity"
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

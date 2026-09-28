<script setup lang="ts">
import { computed, watch } from "vue";
import { useCycleList, useIntervalFn } from "@vueuse/core";
import ProductImage from "./ProductImage.vue";

export interface ProductImageCarouselProps {
  blobIds?: string[] | null;
  productId?: string | null;
  alt?: string;
  autoPlay?: boolean;
  interval?: number;
  pauseOnHover?: boolean;
  showArrows?: boolean;
  showDots?: boolean;
  showThumbnails?: boolean;
  showCounter?: boolean;
  variant?: "card" | "detail";
  objectFit?: "contain" | "cover";
  imgClass?: string;
  fallbackIcon?: string;
}

const props = withDefaults(defineProps<ProductImageCarouselProps>(), {
  blobIds: () => [],
  productId: null,
  alt: "Imagen del producto",
  autoPlay: true,
  interval: 3500,
  pauseOnHover: true,
  showArrows: true,
  showDots: true,
  showThumbnails: false,
  showCounter: false,
  variant: "card",
  objectFit: "contain",
  imgClass: "",
  fallbackIcon: "fa-solid fa-box",
});

const emit = defineEmits<{
  (e: "change", index: number, blobId: string | null): void;
}>();

// Ensure clean list of non-empty blob IDs
const imageList = computed<string[]>(() => {
  if (Array.isArray(props.blobIds)) {
    return props.blobIds.filter((id): id is string => Boolean(id && typeof id === "string"));
  }
  return [];
});

const hasMultipleImages = computed(() => imageList.value.length > 1);

// VueUse useCycleList for cycling through available image blob IDs
const {
  state: currentBlobId,
  next: cycleNext,
  prev: cyclePrev,
  index: currentIndex,
  go: goToIndex,
} = useCycleList(imageList);

// Auto-play timer using VueUse useIntervalFn
const { pause, resume } = useIntervalFn(
  () => {
    if (hasMultipleImages.value && props.autoPlay) {
      cycleNext();
    }
  },
  props.interval,
  { immediate: props.autoPlay && hasMultipleImages.value }
);

// Watch for prop changes to update interval or restart autoPlay
watch(
  [() => props.autoPlay, hasMultipleImages],
  ([canAutoPlay, isMultiple]) => {
    if (canAutoPlay && isMultiple) {
      resume();
    } else {
      pause();
    }
  },
  { immediate: true }
);

// Emit change event when active index changes
watch(currentIndex, (newIdx) => {
  emit("change", newIdx, currentBlobId.value ?? null);
});

const resolvedImgClass = computed(() => {
  return [
    props.imgClass,
    props.variant === "card" ? "transition-transform duration-300 group-hover/carousel:scale-105" : ""
  ].filter(Boolean).join(" ");
});

const handleMouseEnter = () => {
  if (props.pauseOnHover && props.autoPlay && hasMultipleImages.value) {
    pause();
  }
};

const handleMouseLeave = () => {
  if (props.pauseOnHover && props.autoPlay && hasMultipleImages.value) {
    resume();
  }
};

const handleNext = (e?: Event) => {
  e?.stopPropagation();
  e?.preventDefault();
  cycleNext();
};

const handlePrev = (e?: Event) => {
  e?.stopPropagation();
  e?.preventDefault();
  cyclePrev();
};

const handleDotClick = (idx: number, e?: Event) => {
  e?.stopPropagation();
  e?.preventDefault();
  goToIndex(idx);
};
</script>

<template>
  <div
    class="group/carousel relative flex w-full flex-col select-none"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Main Image Frame -->
    <div class="relative flex aspect-square h-full w-full items-center justify-center overflow-hidden">
      <!-- Transitioned Product Image -->
      <Transition name="carousel-fade" mode="out-in">
        <ProductImage
          :key="currentBlobId || 'single-img'"
          :blob-id="currentBlobId || imageList[0] || null"
          :product-id="productId"
          :alt="alt"
          :object-fit="objectFit"
          :fallback-icon="fallbackIcon"
          :img-class="resolvedImgClass"
        />
      </Transition>

      <!-- Counter Badge (detail or explicit) -->
      <span
        v-if="showCounter && hasMultipleImages"
        class="pointer-events-none absolute top-3 right-3 z-20 rounded-full bg-slate-900/60 px-2 py-0.5 text-[0.7rem] font-bold text-white backdrop-blur-xs"
      >
        {{ currentIndex + 1 }} / {{ imageList.length }}
      </span>

      <!-- Navigation Arrows (only rendered if multiple images) -->
      <template v-if="showArrows && hasMultipleImages">
        <!-- Prev Button -->
        <button
          type="button"
          aria-label="Imagen anterior"
          :class="[
            'absolute left-2 z-20 flex items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-md backdrop-blur-xs transition-all hover:bg-white hover:text-(--primary-orange) hover:scale-110 active:scale-95 cursor-pointer',
            variant === 'card'
              ? 'h-7 w-7 opacity-0 group-hover/carousel:opacity-100 text-xs'
              : 'h-10 w-10 opacity-90 hover:opacity-100 text-sm'
          ]"
          @click="handlePrev"
        >
          <i class="fa-solid fa-chevron-left"></i>
        </button>

        <!-- Next Button -->
        <button
          type="button"
          aria-label="Siguiente imagen"
          :class="[
            'absolute right-2 z-20 flex items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-md backdrop-blur-xs transition-all hover:bg-white hover:text-(--primary-orange) hover:scale-110 active:scale-95 cursor-pointer',
            variant === 'card'
              ? 'h-7 w-7 opacity-0 group-hover/carousel:opacity-100 text-xs'
              : 'h-10 w-10 opacity-90 hover:opacity-100 text-sm'
          ]"
          @click="handleNext"
        >
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </template>

      <!-- Indicator Dots (only if multiple images) -->
      <div
        v-if="showDots && hasMultipleImages"
        :class="[
          'pointer-events-auto absolute bottom-2 left-0 right-0 z-20 flex items-center justify-center gap-1.5 px-2 transition-opacity duration-200',
          variant === 'card' ? 'opacity-85 group-hover/carousel:opacity-100' : 'opacity-100'
        ]"
      >
        <button
          v-for="(_, idx) in imageList"
          :key="idx"
          type="button"
          :aria-label="`Ir a imagen ${idx + 1}`"
          :class="[
            'h-1.5 rounded-full transition-all duration-300 cursor-pointer',
            currentIndex === idx
              ? 'w-5 bg-(--primary-orange)'
              : 'w-1.5 bg-slate-300/80 hover:bg-slate-400'
          ]"
          @click="handleDotClick(idx, $event)"
        ></button>
      </div>
    </div>

    <!-- Thumbnails Gallery Strip (for Detail View) -->
    <div
      v-if="showThumbnails && hasMultipleImages"
      class="mt-3 flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200"
    >
      <button
        v-for="(bId, idx) in imageList"
        :key="bId"
        type="button"
        :aria-label="`Ver imagen ${idx + 1}`"
        :class="[
          'relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all p-1 bg-white cursor-pointer',
          currentIndex === idx
            ? 'border-(--primary-orange) shadow-sm ring-2 ring-(--primary-orange)/20'
            : 'border-slate-200 hover:border-slate-300 opacity-60 hover:opacity-100'
        ]"
        @click="handleDotClick(idx, $event)"
      >
        <ProductImage
          :blob-id="bId"
          :alt="alt"
          object-fit="contain"
          class="h-full w-full"
        />
      </button>
    </div>
  </div>
</template>

<style scoped>
.carousel-fade-enter-active,
.carousel-fade-leave-active {
  transition: opacity 0.22s ease-in-out;
}

.carousel-fade-enter-from,
.carousel-fade-leave-to {
  opacity: 0;
}
</style>

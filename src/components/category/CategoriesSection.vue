<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, nextTick } from "vue";
import { useCategoryApi } from "@/api/modules/catalog/category/useCategoryApi";
import type { ProductCategoryResponse } from "@/api";
import CategoryImage from "./CategoryImage.vue";

interface CategoryViewItem extends ProductCategoryResponse {
  productCount: number;
}

const categories = ref<CategoryViewItem[]>([]);
const categoryApi = useCategoryApi();
const isLoading = ref(true);

const trackRef = ref<HTMLElement | null>(null);
let animation: Animation | null = null;
let glideAnimFrame: number | null = null;
let resumeTimer: ReturnType<typeof setTimeout> | null = null;

const durationMs = computed(() => {
  const count = categories.value.length || 6;
  return Math.max(count * 3500, 20000);
});

function initAnimation() {
  if (!trackRef.value || categories.value.length === 0) return;

  if (animation) {
    animation.cancel();
    animation = null;
  }

  // Uses native Web Animations API on the compositor thread (exact match to GPU CSS keyframes)
  animation = trackRef.value.animate(
    [
      { transform: "translate3d(0, 0, 0)" },
      { transform: "translate3d(-50%, 0, 0)" },
    ],
    {
      duration: durationMs.value,
      iterations: Infinity,
      easing: "linear",
    }
  );
}

function pause() {
  if (glideAnimFrame !== null) {
    cancelAnimationFrame(glideAnimFrame);
    glideAnimFrame = null;
  }
  if (resumeTimer !== null) {
    clearTimeout(resumeTimer);
    resumeTimer = null;
  }
  if (animation && animation.playState === "running") {
    animation.pause();
  }
}

function scheduleResume(delayMs = 800) {
  if (resumeTimer !== null) {
    clearTimeout(resumeTimer);
  }
  resumeTimer = setTimeout(() => {
    if (animation && animation.playState === "paused") {
      animation.play();
    }
  }, delayMs);
}

function glideTo(targetTime: number, duration = 400) {
  if (!animation) return;

  const startTime = performance.now();
  const initialTime = Number(animation.currentTime ?? 0);
  const totalDuration = durationMs.value;

  function easeOutCubic(t: number) {
    return 1 - Math.pow(1 - t, 3);
  }

  function stepGlide(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);

    let time = initialTime + (targetTime - initialTime) * eased;
    // Wrap seamlessly within [0, totalDuration)
    time = ((time % totalDuration) + totalDuration) % totalDuration;

    if (animation) {
      animation.currentTime = time;
    }

    if (progress < 1) {
      glideAnimFrame = requestAnimationFrame(stepGlide);
    } else {
      glideAnimFrame = null;
    }
  }

  glideAnimFrame = requestAnimationFrame(stepGlide);
}

function handleManualScroll(direction: "left" | "right") {
  if (!animation || categories.value.length === 0) return;

  pause();

  const totalDuration = durationMs.value;
  const timePerCard = totalDuration / categories.value.length;
  // Shift by 2 cards on desktop, 1.2 on mobile
  const isMobile = window.innerWidth < 640;
  const cardsToShift = isMobile ? 1.2 : 2;
  const shiftTime = timePerCard * cardsToShift;

  const current = Number(animation.currentTime ?? 0);
  // 'right' advances forward (content moves left, currentTime increases)
  // 'left' rewinds backward (content moves right, currentTime decreases)
  const target = direction === "right" ? current + shiftTime : current - shiftTime;

  glideTo(target, 400);

  // Resume auto-scroll quickly after the glide transition completes
  scheduleResume(800);
}

function onMouseEnter() {
  pause();
}

function onMouseLeave() {
  scheduleResume(400);
}

onMounted(async () => {
  try {
    const response = await categoryApi.getCategories({ limit: 50 });
    const cats = response.data;

    const metricsMap = await categoryApi
      .getCategoryMetricsBatch({ category_ids: cats.map((c) => c.id) })
      .catch(() => ({} as Record<string, { product_count: number }>));

    categories.value = cats.map((cat) => ({
      ...cat,
      productCount: metricsMap[cat.id]?.product_count ?? 0,
    }));
  } catch (err) {
    console.error("Failed to load categories:", err);
  } finally {
    isLoading.value = false;
    await nextTick();
    initAnimation();
  }
});

onUnmounted(() => {
  if (glideAnimFrame !== null) cancelAnimationFrame(glideAnimFrame);
  if (resumeTimer !== null) clearTimeout(resumeTimer);
  if (animation) animation.cancel();
});
</script>

<template>
  <section id="categorias" class="mx-auto w-full max-w-7xl px-4 sm:px-6">
    <div class="mb-8 flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
      <div>
        <h2 class="mb-2 text-3xl font-bold text-[#023859] sm:text-4xl">Categorías</h2>
        <p class="text-base text-[#718096]">Explora todas nuestras categorías de productos para ti</p>
      </div>
      <router-link
        :to="{ name: 'products' }"
        class="inline-flex items-center gap-2 rounded-full border border-[#023859] bg-white px-5 py-2.5 text-sm font-semibold text-[#023859] transition-all hover:bg-[#023859] hover:text-white shrink-0"
      >
        <span>Ver todos los productos</span>
        <i class="fa-solid fa-arrow-right text-xs"></i>
      </router-link>
    </div>

    <div class="relative w-full">
      <div class="relative w-full rounded-2xl bg-[#00a896] px-4 py-6 sm:px-8 group">
        <!-- Scroll Left Button -->
        <button
          type="button"
          class="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white text-[#023859] shadow-md border border-slate-100 hover:bg-slate-50 hover:text-[#00a896] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/80"
          aria-label="Desplazar categorías hacia la izquierda"
          title="Ver categorías anteriores"
          @click.stop="handleManualScroll('left')"
        >
          <i class="fa-solid fa-chevron-left text-sm sm:text-base"></i>
        </button>

        <!-- Scroll Right Button -->
        <button
          type="button"
          class="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white text-[#023859] shadow-md border border-slate-100 hover:bg-slate-50 hover:text-[#00a896] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/80"
          aria-label="Desplazar categorías hacia la derecha"
          title="Ver más categorías"
          @click.stop="handleManualScroll('right')"
        >
          <i class="fa-solid fa-chevron-right text-sm sm:text-base"></i>
        </button>

        <!-- Internal Scroll Viewport -->
        <div
          class="w-full overflow-hidden rounded-2xl"
          @mouseenter="onMouseEnter"
          @mouseleave="onMouseLeave"
          @touchstart.passive="onMouseEnter"
          @touchend.passive="onMouseLeave"
        >
          <!-- Skeleton Loading State -->
          <div v-if="isLoading" class="carousel-track flex w-max gap-4 sm:gap-6 will-change-transform">
            <div
              v-for="n in 6"
              :key="n"
              class="pointer-events-none flex h-72 w-52 shrink-0 flex-col items-center justify-center rounded-2xl bg-white px-4 py-6 text-center shadow-md"
              aria-hidden="true"
            >
              <div class="mb-4 h-20 w-20 animate-pulse rounded-full bg-slate-200"></div>
              <div class="mb-2 h-4 w-2/3 animate-pulse rounded-md bg-slate-200"></div>
              <div class="h-3 w-1/2 animate-pulse rounded-md bg-slate-200"></div>
            </div>
          </div>

          <!-- Continuous Infinite Track -->
          <div
            v-else
            ref="trackRef"
            class="carousel-track flex w-max gap-4 sm:gap-6 will-change-transform py-1"
          >
            <template v-for="loop in 2" :key="loop">
              <router-link
                v-for="(cat, idx) in categories"
                :key="`${loop}-${cat.id}-${idx}`"
                :to="{ name: 'products', query: { categoryId: cat.id } }"
                class="flex h-72 w-52 shrink-0 flex-col items-center justify-center rounded-2xl bg-white px-4 py-6 text-center shadow-md border-2 border-transparent transition-all duration-200 hover:border-[#ff6a00] hover:bg-[#fffaf5] hover:-translate-y-1"
                :aria-hidden="loop === 2"
                :tabindex="loop === 2 ? -1 : 0"
              >
                <div class="mb-4 h-24 w-24">
                  <CategoryImage :blob-id="cat.image_blob_id" :alt="cat.name" />
                </div>
                <p class="mb-1 text-base font-semibold text-[#023859]">{{ cat.name }}</p>
                <span class="text-sm text-slate-400">{{ cat.productCount }} Productos</span>
              </router-link>
            </template>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

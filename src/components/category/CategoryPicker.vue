<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { categoryApi } from "../../api";
import type { ProductCategoryResponse } from "../../api/services/category/types";
import CategoryImage from "./CategoryImage.vue";

interface Props {
  modelValue?: string | null;
  categories?: ProductCategoryResponse[];
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  categories: () => [],
  title: "Explora otras categorías",
});

const emit = defineEmits<{
  (e: "update:modelValue", id: string): void;
  (e: "select", category: ProductCategoryResponse): void;
}>();

const items = ref<ProductCategoryResponse[]>([]);
const isLoading = ref(false);
const carouselRef = ref<HTMLElement | null>(null);

async function fetchCategories(): Promise<void> {
  if (props.categories && props.categories.length > 0) {
    items.value = props.categories;
    return;
  }

  isLoading.value = true;
  try {
    const res = await categoryApi.getCategories({ limit: 50 });
    items.value = res.data;
  } catch (err) {
    console.error("Failed to load categories for CategoryPicker:", err);
  } finally {
    isLoading.value = false;
  }
}

watch(
  () => props.categories,
  (newCats) => {
    if (newCats && newCats.length > 0) {
      items.value = newCats;
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (!props.categories || props.categories.length === 0) {
    fetchCategories();
  }
});

function handleSelect(cat: ProductCategoryResponse): void {
  emit("update:modelValue", cat.id);
  emit("select", cat);
}

function scroll(direction: "left" | "right"): void {
  if (!carouselRef.value) return;
  const scrollDistance = 260;
  carouselRef.value.scrollBy({
    left: direction === "left" ? -scrollDistance : scrollDistance,
    behavior: "smooth",
  });
}
</script>

<template>
  <section class="mb-8 rounded-2xl bg-[#f5f7f9] px-6 py-5 sm:px-8 sm:py-6">
    <h3 class="mb-4 text-base font-bold text-[#023859]">
      {{ title }}
    </h3>

    <div class="relative flex items-center justify-between gap-3">
      <!-- Nav Left -->
      <button
        type="button"
        class="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-xl text-[#ff6a00] transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
        aria-label="Categoría anterior"
        :disabled="isLoading"
        @click="scroll('left')"
      >
        <i class="fa-solid fa-chevron-left"></i>
      </button>

      <!-- Carousel List -->
      <div
        ref="carouselRef"
        class="flex flex-1 items-center gap-3.5 overflow-x-auto py-1.5 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <!-- Skeleton Loading -->
        <template v-if="isLoading">
          <div
            v-for="n in 10"
            :key="n"
            class="h-16 w-16 shrink-0 animate-pulse rounded-full bg-slate-200"
            aria-hidden="true"
          />
        </template>

        <!-- Category Disks -->
        <template v-else>
          <button
            v-for="cat in items"
            :key="cat.id"
            type="button"
            :aria-label="cat.name"
            :title="cat.name"
            :class="[
              'group flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-full p-[3.5px] transition-all duration-200 focus:outline-none',
              modelValue === cat.id
                ? 'bg-[#00a896] shadow-md scale-105 ring-2 ring-[#00a896]/30'
                : 'bg-[#e0f4f2] hover:bg-[#cdece8] hover:scale-105'
            ]"
            @click="handleSelect(cat)"
          >
            <!-- Inner White Disk containing the icon -->
            <div class="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white p-1.5">
              <CategoryImage
                :blob-id="cat.image_blob_id"
                :alt="cat.name"
                class="h-full w-full object-contain"
              />
            </div>
          </button>
        </template>
      </div>

      <!-- Nav Right -->
      <button
        type="button"
        class="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-xl text-[#ff6a00] transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
        aria-label="Siguiente categoría"
        :disabled="isLoading"
        @click="scroll('right')"
      >
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    </div>
  </section>
</template>

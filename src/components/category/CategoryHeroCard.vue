<script setup lang="ts">
import CategoryImage from "./CategoryImage.vue";

interface Props {
  name: string;
  description?: string | null;
  imageBlobId?: string | null;
  productCount?: number;
}

withDefaults(defineProps<Props>(), {
  description: null,
  imageBlobId: null,
  productCount: 0,
});
</script>

<template>
  <section class="mb-8 grid grid-cols-1 items-center gap-8 rounded-[20px] border border-[#dcdcdc] bg-white p-10 shadow-[0_4px_15px_rgba(0,0,0,0.05)] md:grid-cols-[1fr_2fr_1fr]">
    <!-- Left: Category Image -->
    <div class="flex justify-center">
      <div class="h-36 w-36 overflow-hidden">
        <CategoryImage :blob-id="imageBlobId" :alt="name" />
      </div>
    </div>

    <!-- Center: Details & Badge -->
    <div class="text-center md:text-left">
      <h1 class="mb-3 font-serif text-3xl font-bold text-[#023859] md:text-4xl">
        {{ name }}
      </h1>
      <p v-if="description" class="mb-6 text-base text-slate-500 md:text-lg">
        {{ description }}
      </p>
      <div class="inline-flex items-center gap-2 rounded-full bg-[#e2f4f2] px-4 py-2 text-sm font-semibold text-[#00a896]">
        <i class="fa-solid fa-bag-shopping"></i>
        <span>{{ productCount }} Productos disponibles</span>
      </div>
    </div>

    <!-- Right: Visual Graphic -->
    <div class="flex justify-center md:justify-end">
      <div class="relative h-30 w-30">
        <div class="absolute top-5 left-2 z-20 h-10 w-10 rounded-full bg-[#00a896]"></div>
        <div class="absolute top-1 left-10 z-10 h-10 w-10 rounded-full bg-[#ff6a00]"></div>
        <div class="absolute top-10 left-10 z-30 h-10 w-10 rounded-full bg-[#023859]"></div>
      </div>
    </div>
  </section>
</template>

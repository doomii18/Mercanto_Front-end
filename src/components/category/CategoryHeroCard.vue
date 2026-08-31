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
    <div class="text-center md:text-left min-h-40 flex flex-col justify-center">
      <h1 class="mb-3 font-serif text-3xl font-bold text-[#023859] md:text-4xl">
        {{ name }}
      </h1>
      <p v-if="description" class="mb-6 text-base text-slate-500 md:text-lg line-clamp-2">
        {{ description }}
      </p>
      <div class="inline-flex items-center gap-2 rounded-full bg-[#e2f4f2] px-4 py-2 text-sm font-semibold text-[#00a896] self-center md:self-start">
        <i class="fa-solid fa-bag-shopping"></i>
        <span>{{ productCount }} Productos disponibles</span>
      </div>
    </div>


    <div class="hidden md:flex justify-end pr-4">
      <div class="relative h-24 w-32">
        <div class="absolute -top-2 left-0 z-20 h-16 w-16 rounded-full bg-[#00a896]/90 shadow-xl backdrop-blur-md transition-transform hover:scale-105"></div>
        <div class="absolute top-8 left-8 z-10 h-16 w-16 rounded-full bg-[#ff6a00]/90 shadow-xl backdrop-blur-md transition-transform hover:scale-105"></div>
        <div class="absolute top-2 left-16 z-30 h-16 w-16 rounded-full bg-[#023859]/90 shadow-xl backdrop-blur-md transition-transform hover:scale-105"></div>
      </div>
    </div>
  </section>
</template>

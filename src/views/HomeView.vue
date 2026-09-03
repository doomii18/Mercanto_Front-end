<script setup lang="ts">
import HomeCarousel from "@/components/home/HomeCarousel.vue";
import TrustFeaturesSection from "@/components/home/TrustFeaturesSection.vue";
import CategoriesSection from "../components/category/CategoriesSection.vue";
import TopProductsSection from "../components/product/TopProductsSection.vue";
import TopProvidersSection from "../components/organization/TopProvidersSection.vue";
import HowItWorksSection from "@/components/home/HowItWorksSection.vue";

</script>

<template>
    <div class="w-full overflow-x-hidden flex flex-col items-center gap-16 mb-25">
        <HomeCarousel />
        <TrustFeaturesSection />
        <CategoriesSection />
        <TopProductsSection />
        <TopProvidersSection />
        <HowItWorksSection />
    </div>
</template>

<script setup lang="ts">
import AppNavbar from "@/components/common/AppNavbar.vue";
import AppFooter from "@/components/common/AppFooter.vue";
</script>

<template>
  <div class="main-layout">
    <AppNavbar />
    <router-view />
    <AppFooter />
  </div>
</template>

<style scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>

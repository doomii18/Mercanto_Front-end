<script setup lang="ts">
import { computed } from "vue";
import { formatPhone } from "@/utils/formatters";

const props = defineProps<{ value: string }>();

const formatted = computed(() => (props.value ? formatPhone(props.value) : "—"));
</script>

<template>
  <span>{{ formatted }}</span>
</template>

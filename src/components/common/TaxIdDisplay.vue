<script setup lang="ts">
import { computed } from "vue";
import { formatTaxId } from "@/utils/formatters";

const props = defineProps<{ value: string }>();

const formatted = computed(() =>
  props.value ? formatTaxId(props.value) : "—"
);
</script>

<template>
  <span>{{ formatted }}</span>
</template>

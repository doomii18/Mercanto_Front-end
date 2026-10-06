<script setup lang="ts">
import { computed } from "vue";
import { formatNationalId } from "@/utils/formatters";

const props = defineProps<{ value: string }>();

const formatted = computed(() =>
  props.value ? formatNationalId(props.value) : "—"
);
</script>

<template>
  <span>{{ formatted }}</span>
</template>

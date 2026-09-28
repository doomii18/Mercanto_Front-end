<script setup lang="ts">
import { computed, toRef } from "vue";
import {
  usePasswordStrength,
  type PasswordRequirement,
  type PasswordStrengthColors,
} from "@/composables/usePasswordStrength";

interface Props {
  // Option 1: Pass raw password and optional options for self-contained mode
  password?: string;
  confirmPassword?: string;
  userInputs?: string[];
  minLength?: number;
  maxLength?: number;

  // Option 2: Pass pre-computed outputs from usePasswordStrength
  score?: number;
  strengthLabel?: string;
  strengthColors?: PasswordStrengthColors;
  warning?: string | null;
  suggestions?: string[];
  requirements?: PasswordRequirement[];

  // Display toggles
  showRequirements?: boolean;
  showRecommendations?: boolean;
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  password: "",
  userInputs: () => [],
  showRequirements: true,
  showRecommendations: true,
  compact: false,
});

// Self-contained fallback composable if pre-computed props aren't provided
const internalStrength = usePasswordStrength(toRef(props, "password"), {
  confirmPassword: toRef(props, "confirmPassword"),
  userInputs: toRef(props, "userInputs"),
  minLength: props.minLength,
  maxLength: props.maxLength,
});

// Resolved values prioritizing props if passed
const currentPassword = computed(() => props.password || internalStrength.password.value);
const hasInput = computed(() => currentPassword.value.length > 0);

const resolvedScore = computed(() =>
  props.score !== undefined ? props.score : internalStrength.score.value
);

const resolvedLabel = computed(() =>
  props.strengthLabel !== undefined ? props.strengthLabel : internalStrength.strengthLabel.value
);

const resolvedColors = computed<PasswordStrengthColors>(() =>
  props.strengthColors !== undefined ? props.strengthColors : internalStrength.strengthColors.value
);

const resolvedWarning = computed(() =>
  props.warning !== undefined ? props.warning : internalStrength.warning.value
);

const resolvedSuggestions = computed(() =>
  props.suggestions !== undefined ? props.suggestions : internalStrength.suggestions.value
);

const resolvedRequirements = computed<PasswordRequirement[]>(() =>
  props.requirements !== undefined ? props.requirements : internalStrength.requirements.value
);

// Segment calculation for a 4-bar indicator
const getSegmentClass = (segmentIndex: number) => {
  if (!hasInput.value) {
    return "bg-slate-200";
  }

  // segmentIndex is 1, 2, 3, 4
  const active = resolvedScore.value >= segmentIndex || (segmentIndex === 1 && resolvedScore.value === 0);

  if (!active) {
    return "bg-slate-200";
  }

  switch (resolvedScore.value) {
    case 0:
      return "bg-rose-500";
    case 1:
      return "bg-amber-500";
    case 2:
      return "bg-yellow-500";
    case 3:
      return "bg-teal-500";
    case 4:
      return "bg-emerald-500";
    default:
      return "bg-slate-200";
  }
};
</script>

<template>
  <div class="password-strength-container space-y-2 text-left">
    <!-- Strength Meter Bar & Label -->
    <div v-if="hasInput" class="strength-meter-section space-y-1.5">
      <div class="flex items-center justify-between text-xs">
        <span class="font-medium text-slate-500">Seguridad de la contraseña:</span>
        <span
          class="font-semibold px-2 py-0.5 rounded text-[0.72rem] transition-colors"
          :class="[resolvedColors.text, resolvedColors.trackBg]"
        >
          {{ resolvedLabel }}
        </span>
      </div>

      <!-- 4-segment visual bar -->
      <div class="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        <div
          v-for="seg in 4"
          :key="seg"
          class="h-full rounded-full transition-all duration-300"
          :class="getSegmentClass(seg)"
        />
      </div>
    </div>

    <!-- Recommendations in Spanish (zxcvbn Warning & Suggestions) -->
    <div
      v-if="showRecommendations && hasInput && (resolvedWarning || resolvedSuggestions.length > 0)"
      class="recommendations-section space-y-1.5 pt-0.5"
    >
      <!-- Warning banner if vulnerable/common -->
      <div
        v-if="resolvedWarning"
        class="flex items-start gap-2 rounded-lg bg-rose-50/90 border border-rose-200/80 p-2 text-xs text-rose-800 animate-fadeIn"
      >
        <i class="fa-solid fa-triangle-exclamation mt-0.5 text-rose-500 shrink-0"></i>
        <span>{{ resolvedWarning }}</span>
      </div>

      <!-- Improvement suggestions in Spanish -->
      <div
        v-if="resolvedSuggestions.length > 0"
        class="rounded-lg bg-sky-50/80 border border-sky-200/70 p-2 text-xs text-slate-700 animate-fadeIn"
      >
        <div class="flex items-center gap-1.5 font-semibold text-sky-800 mb-1">
          <i class="fa-regular fa-lightbulb text-sky-600"></i>
          <span>Recomendaciones para mejorar:</span>
        </div>
        <ul class="list-disc pl-4 space-y-0.5 text-slate-600 text-[0.75rem]">
          <li v-for="(tip, idx) in resolvedSuggestions" :key="idx">
            {{ tip }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Requirements Checklist (matching backend validation) -->
    <div
      v-if="showRequirements"
      class="requirements-section"
      :class="compact ? 'grid grid-cols-2 gap-1 rounded-lg bg-slate-50 p-2 text-[0.72rem]' : 'grid grid-cols-1 sm:grid-cols-2 gap-1 rounded-lg bg-slate-50/90 border border-slate-200/60 p-2 text-[0.74rem]'"
    >
      <div
        v-for="req in resolvedRequirements"
        :key="req.id"
        class="flex items-center gap-1.5 transition-colors"
        :class="req.met ? 'text-emerald-600 font-medium' : 'text-slate-400'"
      >
        <i
          class="shrink-0"
          :class="req.met ? 'fa-solid fa-check text-emerald-500' : 'fa-solid fa-circle text-[0.38rem] text-slate-300'"
        ></i>
        <span>{{ req.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}
</style>

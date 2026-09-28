import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { Options, ZxcvbnFactory, type ZxcvbnResult } from "@zxcvbn-ts/core";
import { adjacencyGraphs, dictionary as commonDictionary } from "@zxcvbn-ts/language-common";
import { translations as esTranslations, dictionary as esDictionary } from "@zxcvbn-ts/language-es-es";

// Shared zxcvbn instance configured with Spanish translations & dictionaries
const zxcvbnOptions = new Options({
  dictionary: {
    ...commonDictionary,
    ...esDictionary,
  },
  graphs: adjacencyGraphs,
  translations: esTranslations,
});

const zxcvbn = new ZxcvbnFactory(zxcvbnOptions);

export interface PasswordStrengthOptions {
  userInputs?: MaybeRefOrGetter<string[]>;
  confirmPassword?: MaybeRefOrGetter<string | undefined>;
  minLength?: number;
  maxLength?: number;
}

export interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

export interface PasswordStrengthColors {
  bg: string;
  text: string;
  border: string;
  trackBg: string;
}

/**
 * Standalone one-shot evaluation for non-reactive contexts
 */
export function checkPasswordStrength(
  password: string,
  userInputs: string[] = []
): ZxcvbnResult {
  return zxcvbn.check(password, userInputs);
}

/**
 * Reusable Vue 3 Composable for comprehensive password strength and compliance evaluation
 */
export function usePasswordStrength(
  passwordInput: MaybeRefOrGetter<string>,
  options: PasswordStrengthOptions = {}
) {
  const minLength = options.minLength ?? 8;
  const maxLength = options.maxLength ?? 128;

  const currentPassword = computed(() => toValue(passwordInput) || "");
  const currentConfirmPassword = computed(() => {
    return options.confirmPassword !== undefined ? toValue(options.confirmPassword) || "" : "";
  });

  const currentUserInputs = computed(() => {
    return options.userInputs ? toValue(options.userInputs) || [] : [];
  });

  // Run zxcvbn analysis with Spanish dictionaries and contextual user inputs
  const result = computed<ZxcvbnResult>(() => {
    const pwd = currentPassword.value;
    if (!pwd) {
      return zxcvbn.check("", currentUserInputs.value);
    }
    return zxcvbn.check(pwd, currentUserInputs.value);
  });

  // Basic security rule booleans matching backend nutype validation
  const hasMinLength = computed(() => {
    const len = currentPassword.value.length;
    return len >= minLength && len <= maxLength;
  });

  const hasUppercase = computed(() => /[A-Z]/.test(currentPassword.value));
  const hasLowercase = computed(() => /[a-z]/.test(currentPassword.value));
  const hasNumber = computed(() => /\d/.test(currentPassword.value));
  const hasSpecialChar = computed(() => /[^A-Za-z0-9]/.test(currentPassword.value));

  // Meets all structural requirements enforced by the backend
  const meetsAllRequirements = computed(() => {
    return hasMinLength.value && hasUppercase.value && hasLowercase.value && hasNumber.value;
  });

  // Password confirmation check
  const passwordsMatch = computed(() => {
    if (options.confirmPassword === undefined) return true;
    return (
      currentConfirmPassword.value.length > 0 &&
      currentPassword.value === currentConfirmPassword.value
    );
  });

  // Score: 0 (muy débil) to 4 (muy fuerte). If password is empty, 0.
  const score = computed<number>(() => {
    if (!currentPassword.value) return 0;
    return result.value.score;
  });

  // Score percentage for progress bar binding (0% to 100%)
  const scorePercentage = computed<number>(() => {
    if (!currentPassword.value) return 0;
    return Math.max(15, (score.value + 1) * 20);
  });

  // Human-friendly Spanish strength label
  const strengthLabel = computed<string>(() => {
    if (!currentPassword.value) return "";
    switch (score.value) {
      case 0:
        return "Muy débil";
      case 1:
        return "Débil";
      case 2:
        return "Aceptable";
      case 3:
        return "Fuerte";
      case 4:
        return "Muy segura";
      default:
        return "";
    }
  });

  // Standard Tailwind color classes
  const strengthColors = computed<PasswordStrengthColors>(() => {
    if (!currentPassword.value) {
      return {
        bg: "bg-slate-300",
        text: "text-slate-400",
        border: "border-slate-200",
        trackBg: "bg-slate-100",
      };
    }
    switch (score.value) {
      case 0:
        return {
          bg: "bg-rose-500",
          text: "text-rose-600",
          border: "border-rose-300",
          trackBg: "bg-rose-50",
        };
      case 1:
        return {
          bg: "bg-amber-500",
          text: "text-amber-600",
          border: "border-amber-300",
          trackBg: "bg-amber-50",
        };
      case 2:
        return {
          bg: "bg-yellow-500",
          text: "text-yellow-600",
          border: "border-yellow-300",
          trackBg: "bg-yellow-50",
        };
      case 3:
        return {
          bg: "bg-teal-500",
          text: "text-teal-600",
          border: "border-teal-300",
          trackBg: "bg-teal-50",
        };
      case 4:
        return {
          bg: "bg-emerald-500",
          text: "text-emerald-600",
          border: "border-emerald-300",
          trackBg: "bg-emerald-50",
        };
      default:
        return {
          bg: "bg-slate-300",
          text: "text-slate-500",
          border: "border-slate-200",
          trackBg: "bg-slate-100",
        };
    }
  });

  // Actionable feedback in Spanish
  const warning = computed<string | null>(() => {
    if (!currentPassword.value) return null;
    return result.value.feedback.warning || null;
  });

  const suggestions = computed<string[]>(() => {
    if (!currentPassword.value) return [];
    return result.value.feedback.suggestions || [];
  });

  // Pre-configured requirements checklist ready for v-for
  const requirements = computed<PasswordRequirement[]>(() => [
    {
      id: "length",
      label: `${minLength} a ${maxLength} caracteres`,
      met: hasMinLength.value,
    },
    {
      id: "uppercase",
      label: "Al menos una mayúscula",
      met: hasUppercase.value,
    },
    {
      id: "lowercase",
      label: "Al menos una minúscula",
      met: hasLowercase.value,
    },
    {
      id: "number",
      label: "Al menos un número",
      met: hasNumber.value,
    },
  ]);

  // Overall validity flags
  const isValid = computed(() => {
    return meetsAllRequirements.value && passwordsMatch.value;
  });

  const isStrong = computed(() => {
    return meetsAllRequirements.value && score.value >= 3 && passwordsMatch.value;
  });

  return {
    // Reactive inputs
    password: currentPassword,
    confirmPassword: currentConfirmPassword,

    // Score & Levels
    score,
    scorePercentage,
    strengthLabel,
    strengthColors,

    // Spanish feedback
    warning,
    suggestions,
    result,

    // Backend rule checks
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
    meetsAllRequirements,
    passwordsMatch,
    requirements,

    // Aggregates
    isValid,
    isStrong,
  };
}

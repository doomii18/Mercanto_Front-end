import { computed, nextTick, ref, type MaybeRefOrGetter, toValue } from "vue";

export interface MaskedIdConfig {
  /** Produces the canonical value (plain, uppercase, no separators). */
  sanitize: (raw: string) => string;
  /** Produces the human-readable value (with dashes) for display only. */
  format: (canonical: string) => string;
}

export interface UseMaskedIdInputOptions {
  modelValue: MaybeRefOrGetter<string | null | undefined>;
  setModelValue: (value: string) => void;
  config: MaskedIdConfig;
}

/**
 * Encapsulates the v-model behaviour of a masked Nicaraguan ID input:
 * the model always holds the canonical value while the DOM shows the
 * human-readable format, restoring the caret position on every edit.
 */
export function useMaskedIdInput(options: UseMaskedIdInputOptions) {
  const isFocused = ref(false);

  const canonical = computed(() => toValue(options.modelValue) || "");
  const displayValue = computed(() => options.config.format(canonical.value));

  function onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const raw = target.value;
    const rawCaret = target.selectionStart ?? raw.length;

    const canonicalBeforeCaret = options.config.sanitize(
      raw.slice(0, rawCaret)
    ).length;
    const nextCanonical = options.config.sanitize(raw);
    const formatted = options.config.format(nextCanonical);

    options.setModelValue(nextCanonical);

    // Force the visible value even when the canonical value did not change
    // (e.g. the user typed a character that gets stripped).
    if (target.value !== formatted) {
      target.value = formatted;
    }

    const caret = caretFromCanonicalIndex(formatted, canonicalBeforeCaret);
    nextTick(() => {
      if (document.activeElement === target) {
        target.setSelectionRange(caret, caret);
      }
    });
  }

  function onFocus() {
    isFocused.value = true;
  }

  function onBlur() {
    isFocused.value = false;
  }

  return {
    canonical,
    displayValue,
    isFocused,
    onInput,
    onFocus,
    onBlur,
  };
}

function caretFromCanonicalIndex(
  formatted: string,
  canonicalIndex: number
): number {
  if (canonicalIndex <= 0) return 0;

  let seen = 0;
  let index = 0;
  while (index < formatted.length && seen < canonicalIndex) {
    if (formatted[index] !== "-") seen++;
    index++;
  }
  // Land after a separator that immediately follows the canonical position.
  while (index < formatted.length && formatted[index] === "-") index++;
  return index;
}

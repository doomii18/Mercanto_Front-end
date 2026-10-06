<script setup lang="ts">
import { useVModel } from "@vueuse/core";
import { Primitive } from "reka-ui";
import { useMaskedIdInput } from "@/composables/useMaskedIdInput";
import { formatNationalId, sanitizeNationalId } from "@/utils/formatters";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    hasError?: boolean;
    disabled?: boolean;
    id?: string;
    name?: string;
  }>(),
  {
    modelValue: "",
    placeholder: "001-000000-0000A",
    hasError: false,
    disabled: false,
    id: undefined,
    name: undefined,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "input", value: string): void;
  (e: "blur", ev: FocusEvent): void;
  (e: "focus", ev: FocusEvent): void;
}>();

const model = useVModel(props, "modelValue", emit, {
  passive: true,
  defaultValue: "",
});

const { displayValue, isFocused, onInput, onFocus, onBlur } = useMaskedIdInput({
  modelValue: () => model.value,
  setModelValue: (value) => {
    model.value = value;
    emit("input", value);
  },
  config: { sanitize: sanitizeNationalId, format: formatNationalId },
});

function handleFocus(event: FocusEvent) {
  onFocus();
  emit("focus", event);
}

function handleBlur(event: FocusEvent) {
  onBlur();
  emit("blur", event);
}
</script>

<template>
  <Primitive
    as="input"
    type="text"
    autocomplete="off"
    autocapitalize="characters"
    spellcheck="false"
    :id="id"
    :name="name"
    :disabled="disabled"
    :placeholder="placeholder"
    :value="displayValue"
    :class="[
      'nicaragua-id-input',
      {
        'input-error': hasError,
        'is-focused': isFocused,
        'is-disabled': disabled,
      },
    ]"
    v-bind="$attrs"
    @input="onInput"
    @focus="handleFocus"
    @blur="handleBlur"
  />
</template>

<style scoped>
.nicaragua-id-input.is-disabled {
  cursor: not-allowed;
  opacity: 0.75;
}
</style>

<script lang="ts">
export interface CountryOption {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  placeholder: string;
}

export const CENTRAL_AMERICA_COUNTRIES: CountryOption[] = [
  { code: "NI", name: "Nicaragua", dialCode: "+505", flag: "🇳🇮", placeholder: "8787 8787" },
  { code: "CR", name: "Costa Rica", dialCode: "+506", flag: "🇨🇷", placeholder: "8787 8787" },
  { code: "HN", name: "Honduras", dialCode: "+504", flag: "🇭🇳", placeholder: "9787 8787" },
  { code: "SV", name: "El Salvador", dialCode: "+503", flag: "🇸🇻", placeholder: "7787 8787" },
  { code: "GT", name: "Guatemala", dialCode: "+502", flag: "🇬🇹", placeholder: "5787 8787" },
  { code: "PA", name: "Panamá", dialCode: "+507", flag: "🇵🇦", placeholder: "6787 8787" },
  { code: "BZ", name: "Belice", dialCode: "+501", flag: "🇧🇿", placeholder: "678 7878" },
  { code: "US", name: "Estados Unidos", dialCode: "+1", flag: "🇺🇸", placeholder: "202 555 0123" },
];
</script>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useVModel } from "@vueuse/core";
import {
  SelectRoot,
  SelectTrigger,
  SelectIcon,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
} from "reka-ui";

const props = withDefaults(
  defineProps<{
    modelValue?: string | null;
    placeholder?: string;
    hasError?: boolean;
    disabled?: boolean;
    id?: string;
    name?: string;
  }>(),
  {
    modelValue: "",
    placeholder: "",
    hasError: false,
    disabled: false,
    id: undefined,
    name: undefined,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "blur", ev: FocusEvent): void;
  (e: "input", value: string): void;
  (e: "change", value: string): void;
}>();

const model = useVModel(props, "modelValue", emit, {
  passive: true,
  defaultValue: "",
});

const selectedCountryCode = ref<string>("NI");
const subscriberNumber = ref<string>("");
const isFocused = ref(false);

const activeCountry = computed(() => {
  return (
    CENTRAL_AMERICA_COUNTRIES.find((c) => c.code === selectedCountryCode.value) ||
    CENTRAL_AMERICA_COUNTRIES[0]
  );
});

const currentPlaceholder = computed(() => {
  return props.placeholder || activeCountry.value.placeholder;
});

// Parse incoming full phone string into country and subscriber digits
function parseIncomingPhone(fullNumber: string | null | undefined) {
  if (!fullNumber || !fullNumber.trim()) {
    subscriberNumber.value = "";
    return;
  }

  const clean = fullNumber.trim().replace(/[\s-]/g, "");

  // Match the longest dialCode first
  const sorted = [...CENTRAL_AMERICA_COUNTRIES].sort(
    (a, b) => b.dialCode.length - a.dialCode.length
  );

  const matched = sorted.find((c) => clean.startsWith(c.dialCode));
  if (matched) {
    selectedCountryCode.value = matched.code;
    subscriberNumber.value = clean.slice(matched.dialCode.length);
  } else if (clean.startsWith("+")) {
    // Unknown country code with +, keep digits in subscriber or default to NI
    subscriberNumber.value = clean.replace(/^\+\d{1,4}/, "");
  } else {
    // Raw subscriber digits without country prefix
    subscriberNumber.value = clean;
  }
}

// Sync changes to modelValue
function emitCombinedPhone() {
  const cleanDigits = subscriberNumber.value.replace(/\D/g, "");
  if (!cleanDigits) {
    model.value = "";
    emit("input", "");
    emit("change", "");
    return;
  }

  const full = `${activeCountry.value.dialCode}${cleanDigits}`;
  if (model.value !== full) {
    model.value = full;
    emit("input", full);
    emit("change", full);
  }
}

function handleCountryChange(newCode: string) {
  selectedCountryCode.value = newCode;
  emitCombinedPhone();
}

function handleSubscriberInput(ev: Event) {
  const target = ev.target as HTMLInputElement;
  // Allow user to type numbers, dashes, spaces
  subscriberNumber.value = target.value;
  emitCombinedPhone();
}

function handleBlur(ev: FocusEvent) {
  isFocused.value = false;
  emit("blur", ev);
}

function handleFocus() {
  isFocused.value = true;
}

watch(
  () => props.modelValue,
  (newVal) => {
    const cleanDigits = subscriberNumber.value.replace(/\D/g, "");
    const currentCombined = cleanDigits ? `${activeCountry.value.dialCode}${cleanDigits}` : "";
    if (newVal !== currentCombined) {
      parseIncomingPhone(newVal);
    }
  }
);

onMounted(() => {
  parseIncomingPhone(props.modelValue);
});
</script>

<template>
  <div
    class="phone-input-root"
    :class="{
      'is-focused': isFocused,
      'has-error': hasError,
      'is-disabled': disabled,
    }"
  >
    <!-- Country Selector (Reka UI Select) -->
    <SelectRoot
      :model-value="selectedCountryCode"
      :disabled="disabled"
      @update:model-value="handleCountryChange"
    >
      <SelectTrigger
        class="country-select-trigger"
        aria-label="Seleccionar código de país"
      >
        <span class="country-flag">{{ activeCountry.flag }}</span>
        <span class="country-dial-code">{{ activeCountry.dialCode }}</span>
        <SelectIcon class="country-select-icon">
          <i class="fa-solid fa-chevron-down"></i>
        </SelectIcon>
      </SelectTrigger>

      <SelectPortal>
        <SelectContent
          position="popper"
          :side-offset="6"
          align="start"
          class="country-dropdown-content z-[99999] min-w-[240px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-2xl opacity-100"
          style="background-color: #ffffff !important; opacity: 1 !important;"
        >
          <SelectViewport class="country-dropdown-viewport max-h-[280px] p-1 space-y-0.5 bg-white">
            <SelectItem
              v-for="country in CENTRAL_AMERICA_COUNTRIES"
              :key="country.code"
              :value="country.code"
              class="country-select-item relative flex cursor-pointer select-none items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-100 data-[highlighted]:bg-[#00a896]/10 data-[highlighted]:text-[#023859] data-[state=checked]:bg-[#00a896]/10 data-[state=checked]:text-[#00a896]"
            >
              <div class="country-item-left flex items-center gap-2">
                <span class="item-flag text-base leading-none">{{ country.flag }}</span>
                <SelectItemText class="item-name text-xs font-medium text-slate-800">{{ country.name }}</SelectItemText>
              </div>
              <div class="country-item-right flex items-center gap-2 ml-4">
                <span class="item-dial text-xs font-semibold text-slate-500">{{ country.dialCode }}</span>
                <SelectItemIndicator class="item-indicator text-[#00a896]">
                  <i class="fa-solid fa-check text-xs"></i>
                </SelectItemIndicator>
              </div>
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>

    <div class="phone-divider"></div>

    <!-- Subscriber Number Input -->
    <input
      :id="id"
      :name="name"
      type="tel"
      inputmode="numeric"
      maxlength="15"
      class="subscriber-input"
      :placeholder="currentPlaceholder"
      :disabled="disabled"
      :value="subscriberNumber"
      @input="handleSubscriberInput"
      @focus="handleFocus"
      @blur="handleBlur"
    />
  </div>
</template>

<style scoped>
.phone-input-root {
  display: flex;
  align-items: center;
  width: 100%;
  height: 44px;
  background-color: #ffffff;
  border: 1px solid var(--border-gray, #cbd5e1);
  border-radius: 8px;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  overflow: visible;
}

.phone-input-root:hover:not(.is-disabled) {
  border-color: #94a3b8;
}

.phone-input-root.is-focused {
  border-color: var(--light-teal, #00a896) !important;
  box-shadow: 0 0 0 3px rgba(0, 168, 150, 0.15);
}

.phone-input-root.has-error {
  border-color: #ef4444 !important;
  background-color: #fffafb;
}

.phone-input-root.is-disabled {
  background-color: #f1f5f9;
  cursor: not-allowed;
  opacity: 0.75;
}

/* Country Trigger */
.country-select-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 100%;
  padding: 0 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  outline: none;
  font-size: 0.9rem;
  font-weight: 500;
  color: #334155;
  user-select: none;
  flex-shrink: 0;
  transition: background-color 0.15s ease;
  border-top-left-radius: 7px;
  border-bottom-left-radius: 7px;
}

.country-select-trigger:hover:not(:disabled) {
  background-color: #f8fafc;
}

.country-flag {
  font-size: 1.15rem;
  line-height: 1;
}

.country-dial-code {
  font-family: inherit;
  font-size: 0.88rem;
  color: #1e293b;
  font-weight: 600;
}

.country-select-icon {
  font-size: 0.65rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  transition: transform 0.2s ease;
}

/* Divider */
.phone-divider {
  width: 1px;
  height: 24px;
  background-color: #e2e8f0;
  flex-shrink: 0;
}

/* Input Field */
.subscriber-input {
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  padding: 0 0.85rem;
  font-size: 0.95rem;
  color: #0f172a;
  min-width: 0;
}

.subscriber-input::placeholder {
  color: #94a3b8;
}

.subscriber-input:disabled {
  cursor: not-allowed;
}

/* Dropdown Menu (via SelectPortal) */
:global(.country-dropdown-content),
.country-dropdown-content {
  z-index: 99999 !important;
  min-width: 250px !important;
  background: #ffffff !important;
  background-color: #ffffff !important;
  opacity: 1 !important;
  border: 1px solid #cbd5e1 !important;
  border-radius: 12px !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
  padding: 6px !important;
  overflow: hidden !important;
  animation: scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

:global(.country-dropdown-viewport),
.country-dropdown-viewport {
  max-height: 280px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background-color: #ffffff !important;
  background: #ffffff !important;
}

.country-select-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 0.88rem;
  color: #1e293b;
  cursor: pointer;
  outline: none;
  user-select: none;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.country-select-item:hover,
.country-select-item[data-highlighted] {
  background-color: #f1f5f9;
  color: #023859;
}

.country-select-item[data-state="checked"] {
  background-color: rgba(0, 168, 150, 0.08);
  color: #00a896;
  font-weight: 600;
}

.country-item-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.item-flag {
  font-size: 1.15rem;
  line-height: 1;
}

.item-name {
  font-size: 0.86rem;
}

.country-item-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 1rem;
}

.item-dial {
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
}

.country-select-item[data-state="checked"] .item-dial {
  color: #00a896;
}

.item-indicator {
  font-size: 0.75rem;
  color: #00a896;
  display: flex;
  align-items: center;
}
</style>

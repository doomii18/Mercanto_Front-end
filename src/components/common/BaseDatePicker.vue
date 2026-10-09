<script setup lang="ts">
import { ref, computed } from "vue";
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
  CalendarRoot,
  CalendarHeader,
  CalendarHeading,
  CalendarPrev,
  CalendarNext,
  CalendarGrid,
  CalendarGridHead,
  CalendarHeadCell,
  CalendarGridBody,
  CalendarGridRow,
  CalendarCell,
  CalendarCellTrigger,
} from "reka-ui";
import {
  CalendarDate,
  type DateValue,
} from "@internationalized/date";

const props = withDefaults(
  defineProps<{
    modelValue?: string | DateValue | null;
    placeholder?: string;
    disabled?: boolean;
    buttonClass?: string;
  }>(),
  {
    modelValue: null,
    placeholder: "Seleccionar fecha",
    disabled: false,
    buttonClass: "",
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "change", value: string): void;
}>();

const isOpen = ref(false);

function parseDateStringToCalendarDate(val: string): CalendarDate | undefined {
  if (!val) return undefined;
  const ddmmyyyy = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    return new CalendarDate(parseInt(ddmmyyyy[3], 10), parseInt(ddmmyyyy[2], 10), parseInt(ddmmyyyy[1], 10));
  }
  const yyyymmdd = val.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (yyyymmdd) {
    return new CalendarDate(parseInt(yyyymmdd[1], 10), parseInt(yyyymmdd[2], 10), parseInt(yyyymmdd[3], 10));
  }
  return undefined;
}

function formatCalendarDateToDDMMYYYY(val: DateValue): string {
  const d = String(val.day).padStart(2, "0");
  const m = String(val.month).padStart(2, "0");
  return `${d}/${m}/${val.year}`;
}

const internalDate = computed<DateValue | undefined>({
  get() {
    if (!props.modelValue) return undefined;
    if (typeof props.modelValue === "string") {
      return parseDateStringToCalendarDate(props.modelValue);
    }
    return props.modelValue;
  },
  set(val) {
    if (!val) return;
    const formatted = formatCalendarDateToDDMMYYYY(val);
    emit("update:modelValue", formatted);
    emit("change", formatted);
    isOpen.value = false;
  },
});

const displayText = computed(() => {
  if (internalDate.value) {
    return formatCalendarDateToDDMMYYYY(internalDate.value);
  }
  return props.placeholder;
});
</script>

<template>
  <PopoverRoot v-model:open="isOpen">
    <PopoverTrigger as-child>
      <button
        type="button"
        :disabled="disabled"
        class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        :class="buttonClass"
      >
        <i class="fa-regular fa-calendar-days text-slate-400 text-xs pointer-events-none"></i>
        <span>{{ displayText }}</span>
      </button>
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        side="bottom"
        :side-offset="6"
        class="z-50 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl animate-in fade-in-80"
      >
        <CalendarRoot
          v-model="internalDate"
          locale="es"
          v-slot="{ grid, weekDays }"
          class="w-64"
        >
          <CalendarHeader class="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <CalendarPrev
              class="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <i class="fa-solid fa-chevron-left text-[10px]"></i>
            </CalendarPrev>
            <CalendarHeading class="text-xs font-bold text-slate-800 capitalize" />
            <CalendarNext
              class="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <i class="fa-solid fa-chevron-right text-[10px]"></i>
            </CalendarNext>
          </CalendarHeader>

          <CalendarGrid v-for="month in grid" :key="month.value.toString()" class="w-full border-collapse">
            <CalendarGridHead>
              <CalendarGridRow class="flex w-full justify-between mb-1.5">
                <CalendarHeadCell
                  v-for="day in weekDays"
                  :key="day"
                  class="w-8 text-[10px] font-bold text-slate-400 text-center uppercase"
                >
                  {{ day }}
                </CalendarHeadCell>
              </CalendarGridRow>
            </CalendarGridHead>
            <CalendarGridBody class="space-y-1">
              <CalendarGridRow
                v-for="(row, i) in month.rows"
                :key="`row-${i}`"
                class="flex w-full justify-between"
              >
                <CalendarCell
                  v-for="cell in row"
                  :key="cell.toString()"
                  :date="cell"
                  class="p-0 text-center"
                >
                  <CalendarCellTrigger
                    :day="cell"
                    :month="month.value"
                    class="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold text-slate-700 transition-all hover:bg-slate-100 data-[selected]:bg-[#023859] data-[selected]:text-white data-[outside-view]:text-slate-300 data-[today]:font-bold data-[today]:text-[#ea580c] cursor-pointer outline-none"
                  />
                </CalendarCell>
              </CalendarGridRow>
            </CalendarGridBody>
          </CalendarGrid>
        </CalendarRoot>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

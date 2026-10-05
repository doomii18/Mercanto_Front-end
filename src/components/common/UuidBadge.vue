<script setup lang="ts">
import { ref, computed } from "vue";
import { uuidToCrockford } from "@/utils/formatters";

interface Props {
  uuid: string;
  mode?: "crockford-compact" | "crockford-truncate" | "crockford-full" | "hex-short" | "full";
  prefix?: string;
  copyable?: boolean;
  size?: "xs" | "sm" | "md";
  variant?: "subtle" | "outline" | "ghost";
}

const props = withDefaults(defineProps<Props>(), {
  mode: "crockford-compact",
  prefix: "",
  copyable: true,
  size: "sm",
  variant: "subtle",
});

const isCopied = ref(false);

const fullCrockford = computed(() => {
  if (!props.uuid) return "";
  return uuidToCrockford(props.uuid);
});

const formattedId = computed(() => {
  if (!props.uuid) return "";

  switch (props.mode) {
    case "crockford-compact": {
      // First two 5-character Crockford chunks: e.g. "5XWW7-KN16S"
      const chunks = fullCrockford.value.split("-");
      if (chunks.length >= 2) {
        return `${chunks[0]}-${chunks[1]}`;
      }
      return fullCrockford.value.slice(0, 11);
    }
    case "crockford-truncate": {
      // First chunk and last chunk: e.g. "5XWW7...7MEW1C"
      const chunks = fullCrockford.value.split("-");
      if (chunks.length >= 2) {
        return `${chunks[0]}...${chunks[chunks.length - 1]}`;
      }
      return fullCrockford.value.slice(0, 10);
    }
    case "crockford-full": {
      return fullCrockford.value;
    }
    case "hex-short": {
      const clean = props.uuid.replace(/-/g, "");
      return clean.slice(0, 8);
    }
    case "full": {
      return props.uuid;
    }
    default:
      return fullCrockford.value.slice(0, 11);
  }
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case "xs":
      return "text-[10px] px-1.5 py-0.5 gap-1 rounded-md";
    case "md":
      return "text-xs px-2.5 py-1.5 gap-1.5 rounded-lg";
    case "sm":
    default:
      return "text-[11px] px-2 py-1 gap-1.5 rounded-lg";
  }
});

const variantClasses = computed(() => {
  if (isCopied.value) {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }

  switch (props.variant) {
    case "outline":
      return "bg-white text-[#023859] border border-slate-200 hover:border-slate-300 hover:bg-slate-50";
    case "ghost":
      return "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800";
    case "subtle":
    default:
      return "bg-slate-100/80 text-[#023859] border border-slate-200/60 hover:bg-slate-200/70 hover:border-slate-300";
  }
});

const copyToClipboard = async () => {
  if (!props.uuid || !props.copyable) return;
  try {
    await navigator.clipboard.writeText(props.uuid);
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 1800);
  } catch (err) {
    console.error("Failed to copy UUID:", err);
  }
};
</script>

<template>
  <button
    type="button"
    :class="[
      'inline-flex items-center font-mono font-bold whitespace-nowrap transition-all select-none',
      sizeClasses,
      variantClasses,
      copyable ? 'cursor-pointer' : 'cursor-default',
    ]"
    :title="isCopied ? '¡UUID copiado al portapapeles!' : `Copiar UUID: ${uuid}`"
    @click.stop="copyToClipboard"
  >
    <!-- Optional Prefix -->
    <span v-if="prefix" class="text-slate-400 font-semibold">{{ prefix }}</span>

    <!-- Formatted ID Text -->
    <span class="tracking-wider">{{ formattedId }}</span>

    <!-- Copy Status Icon -->
    <span v-if="copyable" class="inline-flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity">
      <i
        v-if="isCopied"
        class="fa-solid fa-check text-emerald-600 text-[10px] animate-in zoom-in-50"
      ></i>
      <i
        v-else
        class="fa-regular fa-copy text-slate-400 hover:text-[#00a896] text-[10px]"
      ></i>
    </span>
  </button>
</template>

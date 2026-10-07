<script setup lang="ts">
import { ref, watch } from "vue";
import StarRatingInput from "@/components/common/StarRatingInput.vue";
import { useReviewApi } from "@/api/modules/commerce/review/useReviewApi";
import { useQuoteApi } from "@/api/modules/commerce/quote/useQuoteApi";
import { useToastStore } from "@/stores/ui";
import type { ProductReviewResponse } from "@/api";

interface Props {
  productId: string;
  quoteId?: string;
  initialRating?: number;
  initialComment?: string | null;
  isEditing?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  initialRating: 5,
  initialComment: "",
  isEditing: false,
});

const emit = defineEmits<{
  (e: "submitted", review: ProductReviewResponse): void;
  (e: "cancelled"): void;
}>();

const reviewApi = useReviewApi();
const quoteApi = useQuoteApi();
const toastStore = useToastStore();

const rating = ref(props.initialRating || 5);
const comment = ref(props.initialComment || "");
const isSubmitting = ref(false);
const errorMessage = ref("");

watch(
  () => [props.initialRating, props.initialComment],
  ([newRating, newComment]) => {
    rating.value = (newRating as number) || 5;
    comment.value = (newComment as string) || "";
  }
);

async function resolveFulfilledQuoteId(): Promise<string> {
  if (props.quoteId) {
    return props.quoteId;
  }

  // Find a fulfilled quote of the authenticated buyer that contains this product
  const quotesRes = await quoteApi.getMyQuotes({ statuses: ["fulfilled"] });
  const matchingQuote = quotesRes.data.find((q) =>
    q.items.some((item) => item.product_id === props.productId)
  );

  if (!matchingQuote) {
    throw new Error(
      "No se encontró un pedido completado asociado a este producto para registrar tu reseña."
    );
  }

  return matchingQuote.quote.id;
}

async function handleSubmit() {
  if (rating.value < 1 || rating.value > 5) {
    errorMessage.value = "Por favor selecciona una calificación de 1 a 5 estrellas.";
    return;
  }

  errorMessage.value = "";
  isSubmitting.value = true;

  try {
    const targetQuoteId = await resolveFulfilledQuoteId();

    const trimmedComment = comment.value.trim();
    const reviewResult = await reviewApi.createProductReview({
      product_id: props.productId,
      quote_id: targetQuoteId,
      rating: rating.value,
      comment: trimmedComment.length > 0 ? trimmedComment : null,
    });

    toastStore.addToast({
      title: props.isEditing ? "Reseña actualizada" : "Reseña publicada",
      message: props.isEditing
        ? "Tu reseña ha sido actualizada con éxito."
        : "¡Gracias! Tu reseña ha sido publicada.",
      variant: "success",
    });

    emit("submitted", reviewResult);
  } catch (err: any) {
    console.error("Error al guardar reseña:", err);
    errorMessage.value =
      err?.message || "Ocurrió un error al guardar tu reseña. Por favor intenta de nuevo.";
    toastStore.addToast({
      title: "Error al guardar reseña",
      message: errorMessage.value,
      variant: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <form
    class="rounded-xl border border-slate-200 bg-slate-50/70 p-5 transition-all duration-200"
    @submit.prevent="handleSubmit"
  >
    <div class="mb-3 flex items-center justify-between">
      <h4 class="text-sm font-bold text-[#083c5a]">
        {{ isEditing ? "Editar tu reseña" : "Escribe una reseña" }}
      </h4>
      <span class="text-xs text-slate-500">
        Compra verificada
      </span>
    </div>

    <!-- Rating Selector -->
    <div class="mb-4">
      <label class="mb-1.5 block text-xs font-semibold text-slate-700">
        Calificación general <span class="text-red-500">*</span>
      </label>
      <StarRatingInput
        v-model="rating"
        :disabled="isSubmitting"
        size="md"
      />
    </div>

    <!-- Comment Textarea -->
    <div class="mb-3">
      <div class="mb-1 flex items-center justify-between">
        <label class="text-xs font-semibold text-slate-700">
          Comentario (opcional)
        </label>
        <span class="text-[11px] text-slate-400">
          {{ comment.length }}/2000
        </span>
      </div>
      <textarea
        v-model="comment"
        :disabled="isSubmitting"
        maxlength="2000"
        rows="3"
        placeholder="¿Qué te pareció la calidad del producto, los acabados o el embalaje? Cuéntale a otros compradores..."
        class="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-800 placeholder-slate-400 shadow-sm transition-colors focus:border-[#083c5a] focus:outline-none focus:ring-1 focus:ring-[#083c5a] disabled:bg-slate-100"
      ></textarea>
    </div>

    <!-- Error notice -->
    <div
      v-if="errorMessage"
      class="mb-3 rounded-md bg-red-50 p-2.5 text-xs font-medium text-red-700 flex items-center gap-2"
    >
      <i class="fa-solid fa-circle-exclamation text-red-500"></i>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-end gap-2.5 pt-1">
      <button
        v-if="isEditing"
        type="button"
        :disabled="isSubmitting"
        class="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
        @click="emit('cancelled')"
      >
        Cancelar
      </button>

      <button
        type="submit"
        :disabled="isSubmitting"
        class="inline-flex items-center gap-2 rounded-lg bg-[#083c5a] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#062c43] transition-colors disabled:opacity-50"
      >
        <i
          v-if="isSubmitting"
          class="fa-solid fa-spinner fa-spin text-xs"
        ></i>
        <span>{{ isEditing ? "Guardar cambios" : "Publicar reseña" }}</span>
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useReviewApi } from "@/api/modules/commerce/review/useReviewApi";
import { useUserProfileApi } from "@/api/modules/identity/user_profile/useUserProfileApi";
import { useAuthStore } from "@/stores/auth";
import { useUserContextStore } from "@/stores/auth/userContextStore";
import { useToastStore } from "@/stores/ui";
import ProfileAvatar from "@/components/profile/ProfileAvatar.vue";
import ProductReviewForm from "@/components/product/ProductReviewForm.vue";
import ConfirmModal from "@/components/common/ConfirmModal.vue";
import type { ProductReviewResponse } from "@/api";
import type { ReviewEligibilityDto } from "@/api/modules/commerce/review/types";

interface EnrichedReview extends ProductReviewResponse {
  buyerName: string;
  buyerAvatarBlobId: string | null;
}

const props = defineProps<{
  productId: string;
}>();

const emit = defineEmits<{
  (e: "review-changed"): void;
}>();

const authStore = useAuthStore();
const userContextStore = useUserContextStore();
const reviewApi = useReviewApi();
const userProfileApi = useUserProfileApi();
const toastStore = useToastStore();

const isLoading = ref(true);
const totalReviews = ref(0);
const eligibility = ref<ReviewEligibilityDto | null>(null);

const myReview = ref<EnrichedReview | null>(null);
const otherReviews = ref<EnrichedReview[]>([]);

const isEditingMyReview = ref(false);
const showDeleteConfirmModal = ref(false);
const isDeletingReview = ref(false);

const canLeaveReview = computed(() => {
  return eligibility.value?.can_review === true;
});

const hasOpenQuote = computed(() => {
  return eligibility.value?.has_open_quote === true;
});

const formatDate = (isoString: string) => {
  return new Date(isoString).toLocaleDateString("es-NI", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

async function enrichReview(review: ProductReviewResponse): Promise<EnrichedReview> {
  // If this review belongs to the authenticated user and userContextStore is loaded
  if (
    authStore.isAuthenticated &&
    userContextStore.userProfile &&
    userContextStore.userProfile.account_id === review.buyer_id
  ) {
    return {
      ...review,
      buyerName: userContextStore.displayName || "Tú",
      buyerAvatarBlobId: userContextStore.userProfile.avatar_blob_id ?? null,
    };
  }

  try {
    const profile = await userProfileApi.getUserProfile(review.buyer_id);
    return {
      ...review,
      buyerName: `${profile.first_name} ${profile.last_name}`.trim() || "Comprador",
      buyerAvatarBlobId: profile.avatar_blob_id ?? null,
    };
  } catch {
    return {
      ...review,
      buyerName: "Comprador",
      buyerAvatarBlobId: null,
    };
  }
}

const loadReviewsAndEligibility = async () => {
  if (!props.productId || props.productId.trim() === "") return;

  isLoading.value = true;
  myReview.value = null;
  otherReviews.value = [];
  isEditingMyReview.value = false;

  try {
    // 1. Check eligibility if buyer is authenticated
    if (authStore.isAuthenticated) {
      try {
        const eligibilityMap = await reviewApi.checkProductReviewEligibility({
          product_ids: [props.productId],
        });
        eligibility.value = eligibilityMap[props.productId] ?? null;
      } catch (eligibilityErr) {
        console.warn("Could not check review eligibility:", eligibilityErr);
        eligibility.value = null;
      }
    } else {
      eligibility.value = null;
    }

    // 2. Fetch general product reviews
    const res = await reviewApi.getProductReviews(props.productId, { limit: 20, offset: 0 });
    totalReviews.value = res.total;

    let userReviewRaw: ProductReviewResponse | null = null;
    let otherReviewsRaw: ProductReviewResponse[] = [];

    const existingReviewId = eligibility.value?.review_id;

    if (existingReviewId) {
      // Find user review in the returned batch
      const foundInList = res.data.find((r) => r.id === existingReviewId);
      if (foundInList) {
        userReviewRaw = foundInList;
        otherReviewsRaw = res.data.filter((r) => r.id !== existingReviewId);
      } else {
        // If not in the current page, fetch it directly
        try {
          userReviewRaw = await reviewApi.getProductReview(existingReviewId);
        } catch (fetchErr) {
          console.warn("Could not fetch user existing review directly:", fetchErr);
        }
        otherReviewsRaw = res.data.filter((r) => r.id !== existingReviewId);
      }
    } else {
      otherReviewsRaw = res.data;
    }

    // 3. Enrich user review if found
    if (userReviewRaw) {
      myReview.value = await enrichReview(userReviewRaw);
    }

    // 4. Enrich remaining reviews concurrently
    if (otherReviewsRaw.length > 0) {
      const buyerIds = [...new Set(otherReviewsRaw.map((r) => r.buyer_id))];
      const profilesMap = new Map<string, { name: string; avatar: string | null }>();

      await Promise.allSettled(
        buyerIds.map(async (id) => {
          try {
            const profile = await userProfileApi.getUserProfile(id);
            profilesMap.set(id, {
              name: `${profile.first_name} ${profile.last_name}`.trim() || "Comprador",
              avatar: profile.avatar_blob_id ?? null,
            });
          } catch {
            profilesMap.set(id, { name: "Comprador", avatar: null });
          }
        })
      );

      otherReviews.value = otherReviewsRaw.map((r) => ({
        ...r,
        buyerName: profilesMap.get(r.buyer_id)?.name || "Comprador",
        buyerAvatarBlobId: profilesMap.get(r.buyer_id)?.avatar || null,
      }));
    }
  } catch (err) {
    console.error("Failed to load reviews:", err);
  } finally {
    isLoading.value = false;
  }
};

async function handleReviewSubmitted(savedReview: ProductReviewResponse) {
  isEditingMyReview.value = false;
  myReview.value = await enrichReview(savedReview);

  if (eligibility.value) {
    eligibility.value.review_id = savedReview.id;
  } else {
    eligibility.value = {
      id: props.productId,
      review_id: savedReview.id,
      can_review: true,
      has_open_quote: false,
    };
  }

  // Ensure user's review is not duplicated in otherReviews
  otherReviews.value = otherReviews.value.filter((r) => r.id !== savedReview.id);

  emit("review-changed");
}

async function handleDeleteReview() {
  if (!myReview.value) return;

  isDeletingReview.value = true;
  try {
    await reviewApi.deleteProductReview(myReview.value.id);
    toastStore.addToast({
      title: "Reseña eliminada",
      message: "Tu reseña ha sido eliminada.",
      variant: "info",
    });

    myReview.value = null;
    if (eligibility.value) {
      eligibility.value.review_id = null;
    }
    showDeleteConfirmModal.value = false;
    emit("review-changed");
  } catch (err: any) {
    console.error("Error al eliminar la reseña:", err);
    toastStore.addToast({
      title: "Error al eliminar reseña",
      message: err?.message || "No se pudo eliminar la reseña.",
      variant: "error",
    });
  } finally {
    isDeletingReview.value = false;
  }
}

onMounted(() => {
  loadReviewsAndEligibility();
});

watch(
  () => props.productId,
  () => {
    loadReviewsAndEligibility();
  }
);

watch(
  () => authStore.isAuthenticated,
  () => {
    loadReviewsAndEligibility();
  }
);
</script>

<template>
  <section v-if="productId" class="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div class="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
      <div>
        <h3 class="font-serif text-xl font-bold text-[#083c5a]">
          Calificaciones y reseñas
        </h3>
        <p class="text-xs text-slate-500 mt-0.5">
          Opiniones reales de compradores que han recibido este producto
        </p>
      </div>
      <span class="text-sm font-medium text-slate-500">
        {{ (myReview ? 1 : 0) + otherReviews.length }}
        {{ (myReview ? 1 : 0) + otherReviews.length === 1 ? "reseña" : "reseñas" }}
      </span>
    </div>

    <!-- Review Submission Form (Only shown when buyer CAN review and hasn't reviewed yet) -->
    <div
      v-if="!isLoading && canLeaveReview && !myReview"
      class="mb-6"
    >
      <ProductReviewForm
        :product-id="productId"
        @submitted="handleReviewSubmitted"
      />
    </div>

    <!-- Open Quote Notice (When buyer has an in-progress quote but cannot review yet) -->
    <div
      v-else-if="!isLoading && !canLeaveReview && hasOpenQuote"
      class="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-800"
    >
      <i class="fa-solid fa-clock-rotate-left text-base text-amber-600 mt-0.5 shrink-0"></i>
      <div>
        <p class="font-semibold text-amber-900">
          Tienes un pedido en progreso de este producto
        </p>
        <p class="mt-0.5 text-amber-700 leading-relaxed">
          Podrás calificar y compartir tu experiencia una vez que tu pedido sea completado y entregado.
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col gap-4">
      <div v-for="n in 3" :key="n" class="animate-pulse flex gap-4">
        <div class="h-10 w-10 shrink-0 rounded-full bg-slate-200"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 w-1/3 rounded bg-slate-200"></div>
          <div class="h-3 w-1/4 rounded bg-slate-200"></div>
          <div class="h-16 w-full rounded bg-slate-100"></div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!myReview && otherReviews.length === 0"
      class="py-8 text-center"
    >
      <i class="fa-regular fa-comment-dots text-4xl text-slate-300"></i>
      <p class="mt-3 text-sm text-slate-500">
        Aún no hay reseñas para este producto.
      </p>
    </div>

    <!-- Reviews Content -->
    <div v-else class="flex flex-col gap-6">
      <!-- 1. OUR REVIEW (PINNED FIRST) -->
      <div
        v-if="myReview"
        class="rounded-xl border border-teal-200 bg-teal-50/30 p-5 transition-all shadow-xs"
      >
        <!-- In-place editing form -->
        <div v-if="isEditingMyReview">
          <ProductReviewForm
            :product-id="productId"
            :quote-id="myReview.quote_id"
            :initial-rating="myReview.rating"
            :initial-comment="myReview.comment"
            :is-editing="true"
            @submitted="handleReviewSubmitted"
            @cancelled="isEditingMyReview = false"
          />
        </div>

        <!-- Normal pinned view of user's review -->
        <div v-else class="flex gap-4">
          <div class="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100">
            <ProfileAvatar
              :blob-id="myReview.buyerAvatarBlobId"
              :alt="myReview.buyerName"
            />
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span class="font-bold text-sm text-[#083c5a]">
                  {{ myReview.buyerName }}
                </span>
                <span class="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-semibold text-teal-800">
                  <i class="fa-solid fa-check text-[10px]"></i> Tu reseña
                </span>
                <div class="flex items-center gap-0.5 text-amber-400">
                  <i
                    v-for="star in 5"
                    :key="star"
                    :class="[
                      'text-xs',
                      star <= myReview.rating ? 'fa-solid fa-star' : 'fa-regular fa-star text-slate-300'
                    ]"
                  ></i>
                </div>
                <span class="text-xs text-slate-400">
                  {{ formatDate(myReview.updated_at) }}
                </span>
              </div>

              <!-- Action buttons for user's own review -->
              <div v-if="canLeaveReview" class="flex items-center gap-1.5">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-white hover:text-[#083c5a] transition-colors"
                  title="Editar reseña"
                  @click="isEditingMyReview = true"
                >
                  <i class="fa-solid fa-pen text-[10px]"></i>
                  <span>Editar</span>
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Eliminar reseña"
                  @click="showDeleteConfirmModal = true"
                >
                  <i class="fa-solid fa-trash-can text-[10px]"></i>
                  <span>Eliminar</span>
                </button>
              </div>
            </div>

            <p v-if="myReview.comment" class="text-sm text-slate-700 leading-relaxed mt-1">
              {{ myReview.comment }}
            </p>
            <p v-else class="text-sm italic text-slate-400 mt-1">
              Sin comentarios adicionales.
            </p>
          </div>
        </div>
      </div>

      <!-- Divider if both user review and others exist -->
      <div
        v-if="myReview && otherReviews.length > 0"
        class="flex items-center gap-3 pt-1"
      >
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Otras opiniones
        </span>
        <div class="h-px flex-1 bg-slate-200"></div>
      </div>

      <!-- 2. OTHER REVIEWS LIST -->
      <div
        v-for="review in otherReviews"
        :key="review.id"
        class="flex gap-4 border-b border-slate-100 pb-6 last:border-0 last:pb-0"
      >
        <!-- Avatar -->
        <div class="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100">
          <ProfileAvatar
            :blob-id="review.buyerAvatarBlobId"
            :alt="review.buyerName"
          />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
            <span class="font-semibold text-sm text-[#083c5a]">
              {{ review.buyerName }}
            </span>
            <div class="flex items-center gap-0.5 text-amber-400">
              <i
                v-for="star in 5"
                :key="star"
                :class="[
                  'text-xs',
                  star <= review.rating ? 'fa-solid fa-star' : 'fa-regular fa-star text-slate-300'
                ]"
              ></i>
            </div>
            <span class="text-xs text-slate-400">
              {{ formatDate(review.updated_at) }}
            </span>
          </div>

          <p v-if="review.comment" class="text-sm text-slate-600 leading-relaxed">
            {{ review.comment }}
          </p>
          <p v-else class="text-sm italic text-slate-400">
            Sin comentarios adicionales.
          </p>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <ConfirmModal
      v-model="showDeleteConfirmModal"
      title="Eliminar tu reseña"
      description="¿Estás seguro de que deseas eliminar tu reseña? Esta acción no se puede deshacer."
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      icon="fa-solid fa-trash-can"
      icon-variant="danger"
      :loading="isDeletingReview"
      @confirm="handleDeleteReview"
    />
  </section>
</template>

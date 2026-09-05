<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { reviewApi, userProfileApi } from '@/api';
import type { ProductReviewResponse } from '@/api/services/review/types';
import ProfileAvatar from '@/components/profile/ProfileAvatar.vue';

interface EnrichedReview extends ProductReviewResponse {
  buyerName: string;
  buyerAvatarBlobId: string | null;
}

const props = defineProps<{
  productId: string;
}>();

const reviews = ref<EnrichedReview[]>([]);
const isLoading = ref(true);
const totalReviews = ref(0);

const formatDate = (isoString: string) => {
  return new Date(isoString).toLocaleDateString('es-NI', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const loadReviews = async () => {
  // Guard against initial empty/placeholder IDs
  if (!props.productId || props.productId.trim() === '') return;

  isLoading.value = true;
  reviews.value = [];

  try {
    const res = await reviewApi.getProductReviews(props.productId, { limit: 20, offset: 0 });
    totalReviews.value = res.total;

    if (res.data.length === 0) {
      isLoading.value = false;
      return;
    }

    // Fetch buyer profiles concurrently to display names and avatars
    const buyerIds = [...new Set(res.data.map(r => r.buyer_id))];
    const profilesMap = new Map<string, { name: string; avatar: string | null }>();

    await Promise.allSettled(
      buyerIds.map(async (id) => {
        try {
          const profile = await userProfileApi.getUserProfile(id);
          profilesMap.set(id, {
            name: `${profile.first_name} ${profile.last_name}`.trim() || 'Comprador',
            avatar: profile.avatar_blob_id ?? null,
          });
        } catch {
          profilesMap.set(id, { name: 'Comprador', avatar: null });
        }
      })
    );

    reviews.value = res.data.map((r) => ({
      ...r,
      buyerName: profilesMap.get(r.buyer_id)?.name || 'Comprador',
      buyerAvatarBlobId: profilesMap.get(r.buyer_id)?.avatar || null,
    }));
  } catch (err) {
    console.error('Failed to load reviews:', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadReviews();
});

// Reload reviews if the product ID changes (e.g., navigating between products)
watch(() => props.productId, () => {
  loadReviews();
});
</script>

<template>
  <section class="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div class="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
      <h3 class="font-serif text-xl font-bold text-[#083c5a]">
        Calificaciones y reseñas
      </h3>
      <span class="text-sm font-medium text-slate-500">
        {{ totalReviews }} {{ totalReviews === 1 ? 'reseña' : 'reseñas' }}
      </span>
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
    <div v-else-if="reviews.length === 0" class="py-8 text-center">
      <i class="fa-regular fa-comment-dots text-4xl text-slate-300"></i>
      <p class="mt-3 text-sm text-slate-500">
        Aún no hay reseñas para este producto.
      </p>
    </div>

    <!-- Reviews List -->
    <div v-else class="flex flex-col gap-6">
      <div
        v-for="review in reviews"
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
  </section>
</template>

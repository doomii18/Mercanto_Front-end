<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../modules/auth';
import { productApi } from '../../api';
import type { ProductImageSearchHit } from '../../api/services/product/types';

interface DisplayHit extends ProductImageSearchHit {
  imageUrls: string[];
}

const authStore = useAuthStore();
const fileInput = ref<HTMLInputElement | null>(null);
const currentFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const isSearching = ref(false);
const statusMessage = ref("");
const results = ref<DisplayHit[]>([]);

onMounted(async () => {
  await authStore.initialize();
});

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target.files?.length) {
    clearSelection();
    return;
  }
  const file = target.files[0];
  currentFile.value = file;
  previewUrl.value = URL.createObjectURL(file);
  statusMessage.value = `Ready: ${file.name}`;
  results.value = [];
};

const clearSelection = () => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  currentFile.value = null;
  previewUrl.value = null;
  results.value = [];
  statusMessage.value = "";
  if (fileInput.value) fileInput.value.value = "";
};

const executeSearch = async () => {
  if (!currentFile.value) return;
  isSearching.value = true;
  statusMessage.value = "Searching for similarities...";
  results.value = [];

  try {
    const res = await productApi.searchProductsByImage(currentFile.value);
    if (!res.data || res.data.length === 0) {
      statusMessage.value = "No similar products found.";
      return;
    }

    statusMessage.value = `Found ${res.total} matches. Fetching thumbnails...`;

    // Process hits and fetch images concurrently
    const sorted = res.data.slice().sort((a, b) => a.distance - b.distance);
    const enriched = await Promise.all(
      sorted.map(async (hit) => {
        const urls: string[] = [];
        if (hit.product.image_blob_ids?.length) {
          await Promise.all(
            hit.product.image_blob_ids.map(async (blobId) => {
              try {
                const url = await productApi.getProductImageBlobUrl(blobId);
                urls.push(url);
              } catch (err) {
                console.warn(`Failed image load ${blobId}`);
              }
            })
          );
        }
        return { ...hit, imageUrls: urls };
      })
    );

    results.value = enriched;
    statusMessage.value = `Done. Found ${res.total} matches.`;
  } catch (err: any) {
    console.error(err);
    statusMessage.value = `Search failed: ${err.message}`;
  } finally {
    isSearching.value = false;
  }
};
</script>

<template>
  <div class="search-view">
    <h3>Image Search Tool</h3>

    <div class="search-controls">
      <input
        ref="fileInput"
        type="file"
        accept="image/png, image/jpeg, image/webp"
        @change="handleFileSelect"
      />
      <button
        v-if="currentFile"
        class="btn-search"
        :disabled="isSearching"
        @click="executeSearch"
      >
        <i :class="isSearching ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-magnifying-glass'"></i>
        {{ isSearching ? 'Searching...' : 'Find Matches' }}
      </button>
      <button v-if="currentFile" class="btn-clear" @click="clearSelection" :disabled="isSearching">
        Clear
      </button>
    </div>

    <div v-if="previewUrl" class="preview-area">
      <img :src="previewUrl" alt="Target" class="target-img" />
    </div>

    <p class="status">{{ statusMessage }}</p>

    <div class="results-grid">
      <div v-for="hit in results" :key="hit.product.id" class="result-card">
        <span class="score">Dist: {{ hit.distance.toFixed(3) }}</span>
        <h4>{{ hit.product.title }}</h4>
        <div class="thumbs">
          <img v-for="(url, i) in hit.imageUrls" :key="i" :src="url" alt="match" />
          <span v-if="!hit.imageUrls.length" class="no-img">No Image</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.search-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.btn-search {
  padding: 0.6rem 1.5rem;
  background: var(--light-teal);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.btn-clear {
  padding: 0.6rem 1.5rem;
  background: transparent;
  color: #d9534f;
  border: 1px solid #d9534f;
  border-radius: 8px;
  cursor: pointer;
}
.target-img {
  max-width: 250px;
  max-height: 250px;
  border-radius: 12px;
  border: 2px solid var(--primary-orange);
}
.status {
  color: var(--primary-blue);
  font-weight: 500;
}
.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}
.result-card {
  border: 1px solid var(--border-gray);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.score {
  font-size: 0.8rem;
  color: var(--primary-orange);
  font-weight: 700;
}
.thumbs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}
.thumbs img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
}
.no-img {
  font-size: 0.8rem;
  color: #999;
}
</style>

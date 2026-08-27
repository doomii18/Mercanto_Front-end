import { ref, watch } from "vue";
import { blobCache } from "./index";

export function useBlobUrl(
  getBlobId: () => string | null | undefined,
  fetcher: (id: string) => Promise<Blob>
) {
  const url = ref<string | null>(null);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  const load = async () => {
    const id = getBlobId();

    if (!id) {
      url.value = null;
      isLoading.value = false;
      error.value = null;
      return;
    }

    // Synchronous L1 memory cache hit
    const memoryHit = blobCache.getMemory(id);
    if (memoryHit) {
      url.value = memoryHit;
      isLoading.value = false;
      error.value = null;
      return;
    }

    //  L1 miss -> Async pipeline (L2 IndexedDB / Network fetch)
    isLoading.value = true;
    error.value = null;

    try {
      const resolvedUrl = await blobCache.getOrFetch(id, fetcher);

      // Guard against race conditions if blobId changed mid-flight
      if (getBlobId() === id) {
        url.value = resolvedUrl;
      }
    } catch (err: any) {
      if (getBlobId() === id) {
        error.value = err instanceof Error ? err : new Error(String(err));
        url.value = null;
      }
    } finally {
      if (getBlobId() === id) {
        isLoading.value = false;
      }
    }
  };

  watch(getBlobId, () => load(), { immediate: true });

  return { url, isLoading, error };
}

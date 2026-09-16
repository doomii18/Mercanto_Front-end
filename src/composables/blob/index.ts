type BlobFetcher = (blobId: string) => Promise<Blob>;

const DB_NAME = "mercanto_blob_cache";
const STORE_NAME = "blobs";
const DB_VERSION = 1;

function openBlobDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet(db: IDBDatabase, key: string): Promise<Blob | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbSet(db: IDBDatabase, key: string, blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(blob, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export class BlobCacheManager {
  private memoryCache = new Map<string, string>(); // L1: blobId -> objectUrl
  private inFlight = new Map<string, Promise<string>>();
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private readonly maxMemoryEntries: number;

  constructor(maxMemoryEntries = 200) {
    this.maxMemoryEntries = maxMemoryEntries;
    if (typeof indexedDB !== "undefined") {
      this.dbPromise = openBlobDb().catch((err) => {
        console.warn("IndexedDB blob cache init failed, falling back to L1 only", err);
        return null;
      });
    }
  }

  async getOrFetch(blobId: string, fetcher: BlobFetcher): Promise<string> {
    // L1 Memory Cache Hit
    if (this.memoryCache.has(blobId)) {
      const url = this.memoryCache.get(blobId)!;
      this.refreshLru(blobId, url);
      return url;
    }

    //  In-Flight Request Deduplication
    if (this.inFlight.has(blobId)) {
      return this.inFlight.get(blobId)!;
    }

    // Execution Pipeline (L2 Disk Cache -> Network Fallback)
    const task = (async () => {
      try {
        // Check L2 IndexedDB
        if (this.dbPromise) {
          const db = await this.dbPromise;
          if (db) {
            const persistedBlob = await idbGet(db, blobId);
            if (persistedBlob) {
              const objectUrl = URL.createObjectURL(persistedBlob);
              this.setMemory(blobId, objectUrl);
              return objectUrl;
            }
          }
        }

        // L1 + L2 Miss -> Fetch from backend
        const rawBlob = await fetcher(blobId);
        const objectUrl = URL.createObjectURL(rawBlob);

        // Store L1
        this.setMemory(blobId, objectUrl);

        // Store L2 (Async, non-blocking)
        if (this.dbPromise) {
          this.dbPromise.then((db) => {
            if (db) idbSet(db, blobId, rawBlob).catch(console.warn);
          });
        }

        return objectUrl;
      } finally {
        this.inFlight.delete(blobId);
      }
    })();

    this.inFlight.set(blobId, task);
    return task;
  }

  getMemory(blobId: string): string | undefined {
    return this.memoryCache.get(blobId);
  }

  private setMemory(blobId: string, url: string): void {
    if (this.memoryCache.size >= this.maxMemoryEntries) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) {
        const oldUrl = this.memoryCache.get(oldestKey);
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        this.memoryCache.delete(oldestKey);
      }
    }
    this.memoryCache.set(blobId, url);
  }

  private refreshLru(blobId: string, url: string): void {
    this.memoryCache.delete(blobId);
    this.memoryCache.set(blobId, url);
  }

  clearMemory(): void {
    for (const url of this.memoryCache.values()) {
      URL.revokeObjectURL(url);
    }
    this.memoryCache.clear();
    this.inFlight.clear();
  }
}

export const blobCache = new BlobCacheManager(250);

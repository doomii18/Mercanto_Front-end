export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export interface CacheDriver<T> {
  get(key: string): Promise<CacheEntry<T> | undefined>;
  set(key: string, entry: CacheEntry<T>): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface StoreCacheOptions {
  ttlMs?: number;
  maxMemoryEntries?: number;
  persistent?: boolean;
  dbName?: string;
  storeName?: string;
}

export class IdbCacheDriver<T> implements CacheDriver<T> {
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(
    private readonly dbName: string,
    private readonly storeName: string,
    private readonly version = 1,
  ) {
    if (typeof indexedDB !== "undefined") {
      this.dbPromise = this.openDatabase();
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, this.version);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async get(key: string): Promise<CacheEntry<T> | undefined> {
    if (!this.dbPromise) return undefined;
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, "readonly");
      const store = tx.objectStore(this.storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async set(key: string, entry: CacheEntry<T>): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      const req = store.put(entry, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async delete(key: string): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clear(): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export class StoreCache<T> {
  private memoryCache = new Map<string, CacheEntry<T>>();
  private inFlight = new Map<string, Promise<T>>();
  private l2Driver: CacheDriver<T> | null = null;
  private readonly defaultTtlMs: number;
  private readonly maxMemoryEntries: number;

  constructor(options: StoreCacheOptions = {}) {
    this.defaultTtlMs = options.ttlMs ?? 1000 * 60 * 15; // 15 min default
    this.maxMemoryEntries = options.maxMemoryEntries ?? 200;

    if (options.persistent) {
      this.l2Driver = new IdbCacheDriver<T>(
        options.dbName ?? "mercanto_cache_db",
        options.storeName ?? "store_cache",
      );
    }
  }

  private isExpired(entry?: CacheEntry<T>): boolean {
    if (!entry) return true;
    return Date.now() > entry.expiresAt;
  }

  private enforceMemoryBounds(newKey: string, entry: CacheEntry<T>): void {
    if (this.memoryCache.size >= this.maxMemoryEntries) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) this.memoryCache.delete(oldestKey);
    }
    this.memoryCache.set(newKey, entry);
  }

  async getOrFetch(
    key: string,
    fetcher: () => Promise<T>,
    options: { forceRefresh?: boolean; ttlMs?: number } = {},
  ): Promise<T> {
    const ttl = options.ttlMs ?? this.defaultTtlMs;

    // L1: Memory Cache Hit
    if (!options.forceRefresh) {
      const l1 = this.memoryCache.get(key);
      if (l1 && !this.isExpired(l1)) {
        this.memoryCache.delete(key);
        this.memoryCache.set(key, l1);
        return l1.data;
      }
    }

    // Deduplication: Return pending promise for identical concurrent lookups
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key)!;
    }

    const task = (async () => {
      try {
        // L2: Persistent Disk Cache Hit
        if (!options.forceRefresh && this.l2Driver) {
          const l2 = await this.l2Driver.get(key);
          if (l2 && !this.isExpired(l2)) {
            this.enforceMemoryBounds(key, l2);
            return l2.data;
          }
        }

        // Cache Miss: Delegate to API Service fetcher
        const freshData = await fetcher();
        const entry: CacheEntry<T> = {
          data: freshData,
          expiresAt: Date.now() + ttl,
        };

        this.enforceMemoryBounds(key, entry);

        if (this.l2Driver) {
          this.l2Driver.set(key, entry).catch(console.warn);
        }

        return freshData;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, task);
    return task;
  }

  async set(key: string, data: T, ttlMs?: number): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    };
    this.enforceMemoryBounds(key, entry);
    if (this.l2Driver) {
      await this.l2Driver.set(key, entry);
    }
  }

  async invalidate(key: string): Promise<void> {
    this.memoryCache.delete(key);
    if (this.l2Driver) {
      await this.l2Driver.delete(key);
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.inFlight.clear();
    if (this.l2Driver) {
      await this.l2Driver.clear();
    }
  }

  peekMemory(key: string): T | undefined {
    const entry = this.memoryCache.get(key);
    return entry && !this.isExpired(entry) ? entry.data : undefined;
  }
}

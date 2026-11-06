export class TtlCache<T> {
  private readonly store = new Map<string, { value: T; expiresAt: number }>();
  private readonly inflight = new Map<string, Promise<T>>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries: number,
  ) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T): void {
    if (this.ttlMs <= 0) {
      return;
    }

    if (this.store.size >= this.maxEntries) {
      const now = Date.now();

      for (const [storedKey, entry] of this.store) {
        if (entry.expiresAt <= now) {
          this.store.delete(storedKey);
        }
      }

      if (this.store.size >= this.maxEntries) {
        const oldestKey = this.store.keys().next().value;
        if (oldestKey !== undefined) {
          this.store.delete(oldestKey);
        }
      }
    }

    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  async getOrLoad(
    key: string,
    loader: () => Promise<T>,
  ): Promise<{ value: T; source: 'cache' | 'inflight' | 'db' }> {
    const cached = this.get(key);
    if (cached !== undefined) {
      return { value: cached, source: 'cache' };
    }

    const running = this.inflight.get(key);
    if (running) {
      return { value: await running, source: 'inflight' };
    }

    const promise = loader()
      .then((value) => {
        this.set(key, value);
        return value;
      })
      .finally(() => {
        this.inflight.delete(key);
      });

    this.inflight.set(key, promise);

    return { value: await promise, source: 'db' };
  }
}

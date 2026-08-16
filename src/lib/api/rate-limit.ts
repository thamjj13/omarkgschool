/**
 * In-memory sliding-window rate limiter (per process).
 * Sufficient for a single-instance deployment; swap for Redis-backed
 * storage when running multiple replicas.
 */
interface Window {
  hits: number[];
}

const buckets = new Map<string, Window>();

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export function rateLimit(
  key: string,
  { windowMs, max }: RateLimitOptions
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { hits: [] };
    buckets.set(key, bucket);
  }
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= max) {
    const retryAfterSeconds = Math.ceil((bucket.hits[0] + windowMs - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }
  bucket.hits.push(now);
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Periodic cleanup so the map does not grow unbounded. */
setInterval(
  () => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      bucket.hits = bucket.hits.filter((t) => now - t < 60 * 60 * 1000);
      if (bucket.hits.length === 0) buckets.delete(key);
    }
  },
  10 * 60 * 1000
).unref?.();

/**
 * Limitador de peticiones en memoria (una instancia de ingesta).
 *
 * Suficiente para el ACK de webhooks: frena picos y abuso por IP sin tocar
 * Redis ni añadir latencia. Si algún día hay varias réplicas, se cambia por un
 * limitador compartido.
 */
export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

export interface RateLimiter {
  check(key: string): RateLimitResult;
}

const MAX_TRACKED_KEYS = 10_000;

export function createRateLimiter(
  max: number,
  windowMs: number,
  now: () => number = Date.now,
): RateLimiter {
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return {
    check(key: string): RateLimitResult {
      const current = now();
      const bucket = buckets.get(key);

      if (bucket === undefined || bucket.resetAt <= current) {
        if (buckets.size >= MAX_TRACKED_KEYS) {
          for (const [tracked, value] of buckets) {
            if (value.resetAt <= current) {
              buckets.delete(tracked);
            }
          }
        }

        buckets.set(key, { count: 1, resetAt: current + windowMs });
        return { allowed: true, retryAfterMs: 0 };
      }

      if (bucket.count >= max) {
        return { allowed: false, retryAfterMs: bucket.resetAt - current };
      }

      bucket.count += 1;
      return { allowed: true, retryAfterMs: 0 };
    },
  };
}

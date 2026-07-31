import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Sliding-window rate limiting. When UPSTASH_REDIS_REST_URL/TOKEN are configured this is
// backed by Upstash Redis over its REST API (works identically from Node API routes and
// Edge middleware — no TCP client needed). Without those env vars it falls back to the
// original in-memory limiter so local dev/tests need no cloud account, at the cost of not
// being shared across instances.
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

if (!redis) {
  console.warn(
    '[rateLimit] UPSTASH_REDIS_REST_URL/TOKEN not set — falling back to an in-memory, ' +
      'single-instance rate limiter. Configure Upstash for production/multi-instance deployments.',
  );
}

const limiters = new Map<string, Ratelimit>();

function getLimiter(limit: number, windowMs: number): Ratelimit {
  const key = `${limit}:${windowMs}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis as Redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: 'ratelimit',
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

// In-memory fallback, unchanged from the original single-instance implementation.
const memoryHits = new Map<string, number[]>();

function isRateLimitedInMemory(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (memoryHits.get(key) ?? []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  memoryHits.set(key, timestamps);
  return timestamps.length > limit;
}

export async function isRateLimited(key: string, limit: number, windowMs: number): Promise<boolean> {
  if (!redis) {
    return isRateLimitedInMemory(key, limit, windowMs);
  }
  const { success } = await getLimiter(limit, windowMs).limit(key);
  return !success;
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() ?? 'unknown';
}

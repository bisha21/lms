import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('rateLimit — in-memory fallback (no Upstash env vars)', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('allows requests under the limit and blocks once the limit is exceeded', async () => {
    const { isRateLimited } = await import('@/lib/rateLimit');
    const key = `test-${Math.random()}`;

    expect(await isRateLimited(key, 2, 60_000)).toBe(false);
    expect(await isRateLimited(key, 2, 60_000)).toBe(false);
    expect(await isRateLimited(key, 2, 60_000)).toBe(true);
  });

  it('tracks separate keys independently', async () => {
    const { isRateLimited } = await import('@/lib/rateLimit');

    expect(await isRateLimited('key-a', 1, 60_000)).toBe(false);
    expect(await isRateLimited('key-b', 1, 60_000)).toBe(false);
  });
});

describe('rateLimit — Upstash-backed (env vars present)', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  });

  afterEach(() => {
    vi.doUnmock('@upstash/ratelimit');
    vi.doUnmock('@upstash/redis');
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('delegates to Ratelimit.limit() and negates its `success` flag', async () => {
    const limit = vi.fn().mockResolvedValue({ success: true });
    vi.doMock('@upstash/ratelimit', () => ({
      Ratelimit: Object.assign(
        vi.fn(function RatelimitMock() {
          return { limit };
        }),
        { slidingWindow: vi.fn() },
      ),
    }));
    vi.doMock('@upstash/redis', () => ({
      Redis: vi.fn(function RedisMock() {
        return {};
      }),
    }));

    const { isRateLimited } = await import('@/lib/rateLimit');
    const result = await isRateLimited('some-key', 5, 1000);

    expect(result).toBe(false);
    expect(limit).toHaveBeenCalledWith('some-key');
  });

  it('reuses the same Ratelimit instance for repeated calls with the same limit/window', async () => {
    const limit = vi.fn().mockResolvedValue({ success: false });
    const RatelimitCtor = vi.fn(function RatelimitMock() {
      return { limit };
    });
    vi.doMock('@upstash/ratelimit', () => ({
      Ratelimit: Object.assign(RatelimitCtor, { slidingWindow: vi.fn() }),
    }));
    vi.doMock('@upstash/redis', () => ({
      Redis: vi.fn(function RedisMock() {
        return {};
      }),
    }));

    const { isRateLimited } = await import('@/lib/rateLimit');
    await isRateLimited('a', 5, 1000);
    await isRateLimited('b', 5, 1000);

    expect(RatelimitCtor).toHaveBeenCalledTimes(1);
  });
});

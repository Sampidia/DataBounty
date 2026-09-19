interface RateLimitOptions {
  limit: number;      // Maximum allowed requests
  windowMs: number;   // Window size in milliseconds
}

interface RateLimitStore {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitStore>();

/**
 * Checks if a given key (e.g. IP address + route) has exceeded the allowed rate limit.
 */
export function checkRateLimit(key: string, options: RateLimitOptions): { limited: boolean; current: number; ttlMs: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return { limited: false, current: 1, ttlMs: options.windowMs };
  }

  entry.count += 1;

  if (entry.count > options.limit) {
    return { limited: true, current: entry.count, ttlMs: entry.resetAt - now };
  }

  return { limited: false, current: entry.count, ttlMs: entry.resetAt - now };
}

/**
 * Helper to get client IP from Next.js Request headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Tiny in-memory per-user rate limiter (no external dependency).
 * Fixed-window: at most `max` requests per `windowMs` per authenticated user.
 * Good enough for a single-instance chatbot endpoint; swap for a shared store
 * (Redis) if the API is ever horizontally scaled.
 */
export const rateLimit = ({ max = 20, windowMs = 60_000 } = {}) => {
  const hits = new Map(); // key -> { count, resetAt }

  // Opportunistic cleanup so the map doesn't grow unbounded.
  setInterval(() => {
    const now = Date.now();
    for (const [key, v] of hits) if (v.resetAt <= now) hits.delete(key);
  }, windowMs).unref?.();

  return (req, res, next) => {
    const key = String(req.user?.id ?? req.ip);
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (entry.count >= max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: 'Too many messages. Please wait a moment and try again.',
        code: 'RATE_LIMITED',
        retry_after_seconds: retryAfter,
      });
    }
    entry.count += 1;
    return next();
  };
};

export default rateLimit;

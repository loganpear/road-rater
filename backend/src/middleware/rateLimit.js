import { env } from "../config/env.js";

const buckets = new Map();

export function rateLimit(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || "unknown";
  const now = Date.now();
  const windowStart = now - env.RATE_LIMIT_WINDOW_MS;

  const arr = buckets.get(ip) ?? [];
  const filtered = arr.filter((t) => t > windowStart);
  filtered.push(now);
  buckets.set(ip, filtered);

  if (filtered.length > env.RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: "rate_limited",
      message: "Too many requests"
    });
  }

  next();
}

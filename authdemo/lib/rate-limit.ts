import { NextRequest, NextResponse } from 'next/server';

/**
 * In-process sliding-window rate limiter for the cost-bearing/abusable endpoints
 * (pilot brief #5: chat, upload-URL, auth signup — "simple, infra-free").
 *
 * Design notes:
 *  - Sliding window over per-key timestamp arrays; check-and-increment happens BEFORE
 *    the handler runs, so rejected requests still consume a slot (an attacker can't
 *    dodge the limit by sending requests that fail validation).
 *  - Memory is bounded: expired timestamps are pruned on every hit, and a periodic
 *    sweep drops idle keys entirely.
 *  - KNOWN LIMIT (accepted for roofshot): state is per-process. On a multi-instance
 *    deploy (several serverless workers) each instance enforces its own window, so the
 *    effective global limit is N× the configured one. Still bounds abuse per instance
 *    and fully covers the single-instance pilot. The moonshot backend swap (Workers +
 *    KV) or a DB-backed bucket is the durable upgrade — flagged in the PR notes, not
 *    silently ignored.
 */

interface Bucket {
  hits: number[]; // ms timestamps inside the current window
}

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();
const SWEEP_EVERY_MS = 60_000;

export interface RateLimitRule {
  /** Max requests allowed per window. */
  limit: number;
  windowMs: number;
}

/** Named rules so limits live in ONE place and tests can reference them. */
export const RATE_LIMITS = {
  /** Model + embedding cost per call — tightest. Per user. */
  chat: { limit: 20, windowMs: 60_000 },
  /** Creates DB rows + signs URLs. Per user. */
  uploadUrl: { limit: 30, windowMs: 60_000 },
  /** Account creation — abuse magnet. Per IP. */
  signup: { limit: 10, windowMs: 60 * 60_000 },
  /** Credential guessing guard. Per IP. */
  signin: { limit: 20, windowMs: 10 * 60_000 },
} as const satisfies Record<string, RateLimitRule>;

export function checkRateLimit(
  key: string,
  rule: RateLimitRule,
  now: number = Date.now(),
): { ok: true } | { ok: false; retryAfterSec: number } {
  if (now - lastSweep > SWEEP_EVERY_MS) {
    lastSweep = now;
    const maxWindow = Math.max(...Object.values(RATE_LIMITS).map((r) => r.windowMs));
    for (const [k, b] of buckets) {
      if (b.hits.length === 0 || b.hits[b.hits.length - 1] < now - maxWindow) buckets.delete(k);
    }
  }

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { hits: [] };
    buckets.set(key, bucket);
  }
  const cutoff = now - rule.windowMs;
  bucket.hits = bucket.hits.filter((t) => t > cutoff);

  if (bucket.hits.length >= rule.limit) {
    const oldest = bucket.hits[0];
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((oldest + rule.windowMs - now) / 1000)) };
  }
  bucket.hits.push(now);
  return { ok: true };
}

/** Best-effort client IP (Vercel/proxies set x-forwarded-for; dev falls back). */
export function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? '127.0.0.1';
}

/** Standard 429 with Retry-After. */
export function rateLimitResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { error: 'rate_limited', retryAfterSec },
    { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
  );
}

/** Test hook: reset all buckets (in-process state). */
export function _resetRateLimits(): void {
  buckets.clear();
}

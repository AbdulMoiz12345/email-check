import { NextRequest } from 'next/server'
import { auth } from '../../../../lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'
import {
  checkRateLimit,
  clientIp,
  rateLimitResponse,
  RATE_LIMITS,
} from '../../../../lib/rate-limit'

const handlers = toNextJsHandler(auth)

export const GET = handlers.GET

/**
 * POST /api/auth/* — Better-Auth handler, with per-IP rate limits in front of the two
 * abusable credential endpoints (pilot brief #5): sign-up (account-creation spam) and
 * sign-in (credential guessing). Checked BEFORE Better-Auth runs, so failed attempts
 * consume the budget too. Other auth POSTs (sign-out, verify-email, …) pass through.
 */
export async function POST(req: NextRequest) {
  const path = req.nextUrl.pathname

  if (path.endsWith('/sign-up/email')) {
    const rl = checkRateLimit(`signup:${clientIp(req)}`, RATE_LIMITS.signup)
    if (!rl.ok) return rateLimitResponse(rl.retryAfterSec)
  } else if (path.endsWith('/sign-in/email')) {
    const rl = checkRateLimit(`signin:${clientIp(req)}`, RATE_LIMITS.signin)
    if (!rl.ok) return rateLimitResponse(rl.retryAfterSec)
  }

  return handlers.POST(req)
}

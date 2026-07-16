export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth, dbPool } from '../../../lib/auth';
import { sendInviteEmail } from '../../../lib/email';

/**
 * POST /api/invite { email } — mirrors the real app's invite mechanics:
 * requires a signed-in (verified) session, creates a token-bearing invitation,
 * and sends THE SAME invite email template via THE SAME sender (lib/email.ts).
 * The emailed link is /invite/{token}?tenant=demo — same shape as production.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
    const { email } = (await req.json()) as { email?: string };
    if (!email || !email.includes('@')) return NextResponse.json({ error: 'valid email required' }, { status: 400 });

    const r = await dbPool.query(
      'insert into demo_invitations (email, invited_by) values ($1, $2) returning token',
      [email.toLowerCase(), session.user.email],
    );
    const token = r.rows[0].token as string;
    await sendInviteEmail({ to: email, token, tenantId: 'demo' });
    return NextResponse.json({ ok: true, token });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

/** GET /api/invite — list invitations I sent (to watch accept status flip). */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
  const r = await dbPool.query(
    'select token, email, created_at, expires_at, accepted_at from demo_invitations where invited_by = $1 order by created_at desc limit 20',
    [session.user.email],
  );
  return NextResponse.json({ invitations: r.rows });
}

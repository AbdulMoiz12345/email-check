export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth, dbPool } from '../../../../lib/auth';

/**
 * POST /api/invite/accept { token } — same semantics as the real accept:
 * 401 no session (page then shows signup), 410 invalid/expired/used,
 * 409 signed-in email ≠ invited email, 200 accepted.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) return NextResponse.json({ error: 'Sign in first, then accept the invitation' }, { status: 401 });
    const { token } = (await req.json()) as { token?: string };
    if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

    const r = await dbPool.query('select * from demo_invitations where token = $1', [token]);
    const inv = r.rows[0];
    if (!inv || inv.accepted_at || new Date(inv.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invitation is invalid, expired, or already used.' }, { status: 410 });
    }
    if (inv.email !== session.user.email.toLowerCase()) {
      return NextResponse.json({ error: `This invitation was sent to ${inv.email}. You are signed in as ${session.user.email}.` }, { status: 409 });
    }
    await dbPool.query('update demo_invitations set accepted_at = now() where token = $1', [token]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

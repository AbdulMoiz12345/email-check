export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { dbPool } from '../../../lib/auth';

/**
 * One-time setup: applies the SAME db/better-auth-tables.sql the real app ships,
 * plus a minimal demo invitations table (mirrors the columns the real flow uses).
 * Idempotent — safe to visit repeatedly.
 */
export async function GET() {
  try {
    const sqlRaw = readFileSync(join(process.cwd(), 'db', 'better-auth-tables.sql'), 'utf8');
    // The verbatim file ends with GRANT ... TO caito_app (the real app's DB role).
    // A standalone demo DB (Neon/local) has no such role and doesn't need it — the
    // connection's own role already owns these tables. Strip GRANT lines so setup
    // runs cleanly anywhere while the table DDL stays identical to production.
    const sql = sqlRaw
      .split(/\r?\n/)
      .filter((line) => !/^\s*grant\b/i.test(line))
      .join('\n');
    await dbPool.query(sql);
    await dbPool.query(`
      create table if not exists demo_invitations (
        token uuid primary key default gen_random_uuid(),
        email text not null,
        invited_by text not null,
        created_at timestamptz not null default now(),
        expires_at timestamptz not null default now() + interval '7 days',
        accepted_at timestamptz
      );
    `);
    return NextResponse.json({ ok: true, message: 'Tables ready (better-auth + demo invitations).' });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

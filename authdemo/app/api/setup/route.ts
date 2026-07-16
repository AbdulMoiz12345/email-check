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
    const sql = readFileSync(join(process.cwd(), 'db', 'better-auth-tables.sql'), 'utf8');
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

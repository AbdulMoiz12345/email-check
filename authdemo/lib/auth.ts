import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './auth-schema';
import { sendVerificationEmail } from './email';

/**
 * IDENTICAL Better-Auth configuration to the real app (apps/web/lib/auth.ts):
 * same requireEmailVerification, same sendOnSignUp, same autoSignInAfterVerification,
 * same 1h expiry, same sender hook -> the SAME lib/email.ts (verbatim copy).
 * Only difference: the DB client is created inline here instead of via the
 * monorepo's @caito360/db factory (same driver + adapter underneath).
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') || process.env.DATABASE_URL?.includes('127.0.0.1')
    ? undefined
    : { rejectUnauthorized: false },
});
const rawDb = drizzle(pool);
export const dbPool = pool;

export const auth = betterAuth({
  database: drizzleAdapter(rawDb, { provider: 'pg', schema }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
  emailAndPassword: { enabled: true, requireEmailVerification: true },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    async sendVerificationEmail({ user, url }) {
      await sendVerificationEmail({ to: user.email, url });
    },
  },
});

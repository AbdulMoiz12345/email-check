'use client'
import { createAuthClient } from 'better-auth/react'

/** Same as the real app's lib/auth-client.ts. */
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'),
})

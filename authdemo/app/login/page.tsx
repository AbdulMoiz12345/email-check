'use client'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { card, input, btn, err as errS, ok as okS, muted } from '@/lib/ui'

/**
 * Same logic as the real login page: signIn.email; a 403 EMAIL_NOT_VERIFIED
 * surfaces the "verify first" notice with a resend button.
 */
export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [needsVerify, setNeedsVerify] = useState(false)
  const [resent, setResent] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setNeedsVerify(false)
    const { error: authError } = await authClient.signIn.email({ email: form.email, password: form.password, callbackURL: '/home' })
    setLoading(false)
    if (authError) {
      if (authError.status === 403) { setNeedsVerify(true); return } // EMAIL_NOT_VERIFIED — same as real app
      setError(authError.message ?? 'Login failed')
    }
  }

  const resend = async () => {
    await authClient.sendVerificationEmail({ email: form.email, callbackURL: '/home' })
    setResent(true)
  }

  return (
    <div style={card}>
      <h1 style={{ fontSize: 18, marginTop: 0 }}>Log in</h1>
      <form onSubmit={submit}>
        <input style={input} placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        <input style={input} placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
        <button style={btn} disabled={loading}>{loading ? 'Signing in…' : 'Log in'}</button>
      </form>
      {needsVerify && (
        <div style={{ marginTop: 12 }}>
          <p style={errS}>Your email isn&apos;t verified yet — check your inbox for the verification link.</p>
          {resent ? <p style={okS}>Verification email re-sent.</p> :
            <button style={{ ...btn, background: '#5B677A' }} onClick={resend}>Resend verification email</button>}
        </div>
      )}
      {error && <p style={errS}>{error}</p>}
      <p style={muted}>No account? <a href="/signup">Sign up</a></p>
    </div>
  )
}

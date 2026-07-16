'use client'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { card, input, btn, err as errS, ok as okS, muted } from '@/lib/ui'

/** Same logic as the real signup page: signUp.email + sendOnSignUp -> check-inbox state. */
export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error: authError } = await authClient.signUp.email({
      name: form.name, email: form.email, password: form.password,
      callbackURL: '/home', // real app: /onboarding/plan — same mechanism
    })
    setLoading(false)
    if (authError) { setError(authError.message ?? 'Signup failed'); return }
    setSent(true)
  }

  if (sent) return (
    <div style={card}>
      <h1 style={{ fontSize: 18, marginTop: 0 }}>Check your inbox</h1>
      <p style={muted}>We sent a verification link to <b>{form.email}</b>. Click it — it verifies your address, signs you in, and brings you to the home page. The link expires in 1 hour.</p>
      <p style={okS}>If no Microsoft keys are configured, the link is logged to the server logs instead (same as the real app&apos;s fallback).</p>
    </div>
  )

  return (
    <div style={card}>
      <h1 style={{ fontSize: 18, marginTop: 0 }}>Create account</h1>
      <form onSubmit={submit}>
        <input style={input} placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input style={input} placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        <input style={input} placeholder="Password (min 8 chars)" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} />
        <button style={btn} disabled={loading}>{loading ? 'Creating…' : 'Sign up'}</button>
      </form>
      {error && <p style={errS}>{error}</p>}
      <p style={muted}>Already have an account? <a href="/login">Log in</a></p>
    </div>
  )
}

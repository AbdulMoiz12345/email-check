'use client'
import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { card, input, btn, err as errS, muted } from '@/lib/ui'

/**
 * SAME verify-and-return mechanics as the real app's invite page:
 *  - if a session already exists (e.g. you just clicked the verification link,
 *    whose callbackURL points back HERE), auto-redeem the invitation;
 *  - otherwise show inline signup whose verification callback returns to this URL.
 */
export default function InvitePage({ params }: { params: { token: string } }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [checkInbox, setCheckInbox] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)

  const tryAccept = async () => {
    const res = await fetch('/api/invite/accept', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: params.token }),
    })
    if (res.ok) { setAccepted(true); return true }
    if (res.status !== 401) setError((await res.json()).error ?? 'Could not accept')
    return false
  }

  useEffect(() => { tryAccept() /* auto-redeem when already signed in */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    const { error: authError } = await authClient.signUp.email({
      name: form.name, email: form.email, password: form.password,
      callbackURL: `/invite/${params.token}?tenant=demo`, // return HERE after verifying
    })
    setLoading(false)
    if (authError) { setError(authError.message ?? 'Signup failed'); return }
    setCheckInbox(true)
  }

  if (accepted) return (
    <div style={card}>
      <h1 style={{ fontSize: 18, marginTop: 0 }}>Invitation accepted ✓</h1>
      <p style={muted}>Your account is verified and the invitation is redeemed — in the real app you&apos;d now be inside the inviter&apos;s workspace with the assigned role. <a href="/home">Go to home</a></p>
    </div>
  )
  if (checkInbox) return (
    <div style={card}>
      <h1 style={{ fontSize: 18, marginTop: 0 }}>Check your inbox</h1>
      <p style={muted}>We sent a verification link to <b>{form.email}</b>. Click it — it verifies you, signs you in, brings you back here, and the invitation accepts automatically.</p>
    </div>
  )
  return (
    <div style={card}>
      <h1 style={{ fontSize: 18, marginTop: 0 }}>You&apos;ve been invited</h1>
      <p style={muted}>Create your account to accept the invitation.</p>
      <form onSubmit={submit}>
        <input style={input} placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input style={input} placeholder="Email (use the invited address)" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        <input style={input} placeholder="Password (min 8 chars)" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} />
        <button style={btn} disabled={loading}>{loading ? 'Creating…' : 'Sign up & accept'}</button>
      </form>
      {error && <p style={errS}>{error}</p>}
      <p style={muted}>Already have an account? <a href="/login">Log in</a> first, then reopen this link.</p>
    </div>
  )
}

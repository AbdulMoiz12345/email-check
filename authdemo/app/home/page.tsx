'use client'
import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { card, input, btn, err as errS, ok as okS, muted } from '@/lib/ui'

interface Inv { token: string; email: string; created_at: string; accepted_at: string | null }

/** Post-login page: proves the session, then exercises the invite email flow. */
export default function HomePage() {
  const [me, setMe] = useState<{ email: string; verified: boolean } | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [msg, setMsg] = useState(''); const [error, setError] = useState('')
  const [invs, setInvs] = useState<Inv[]>([])

  const loadInvs = () => fetch('/api/invite', { credentials: 'include' }).then(r => r.json()).then(d => setInvs(d.invitations ?? []))

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (!data?.user) { window.location.href = '/login'; return }
      setMe({ email: data.user.email, verified: !!data.user.emailVerified })
      loadInvs()
    })
  }, [])

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(''); setError('')
    const res = await fetch('/api/invite', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail }),
    })
    const d = await res.json()
    if (!res.ok) { setError(d.error ?? 'Failed'); return }
    setMsg(`Invite email sent to ${inviteEmail}. Have that inbox click the link.`)
    setInviteEmail(''); loadInvs()
  }

  const signOut = async () => { await authClient.signOut(); window.location.href = '/' }

  if (!me) return <div style={card}><p style={muted}>Loading…</p></div>
  return (
    <div style={card}>
      <h1 style={{ fontSize: 18, marginTop: 0 }}>You&apos;re in 🎉</h1>
      <p style={muted}>Signed in as <b>{me.email}</b> — email verified: <b>{String(me.verified)}</b>. This proves signup → verification link → auto-signin worked.</p>
      <hr style={{ border: 0, borderTop: '1px solid #eaf0f5', margin: '16px 0' }} />
      <h2 style={{ fontSize: 15 }}>Invite a teammate (sends the real invite template)</h2>
      <form onSubmit={sendInvite} style={{ display: 'flex', gap: 8 }}>
        <input style={{ ...input, marginBottom: 0, flex: 1 }} type="email" placeholder="teammate@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
        <button style={btn}>Send invite</button>
      </form>
      {msg && <p style={okS}>{msg}</p>}
      {error && <p style={errS}>{error}</p>}
      {invs.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <p style={{ ...muted, fontWeight: 600 }}>Invitations you sent (refresh to update):</p>
          {invs.map(i => (
            <p key={i.token} style={{ ...muted, margin: '4px 0' }}>
              {i.email} — {i.accepted_at ? <b style={{ color: '#109CAA' }}>accepted ✓</b> : 'pending'}
            </p>
          ))}
        </div>
      )}
      <button style={{ ...btn, background: '#5B677A', marginTop: 18 }} onClick={signOut}>Sign out</button>
    </div>
  )
}

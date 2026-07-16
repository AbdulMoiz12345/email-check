'use client'
import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { card, btn, muted } from '@/lib/ui'

export default function Home() {
  const [me, setMe] = useState<{ email: string } | null>(null)
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (data?.user) setMe({ email: data.user.email })
      setLoaded(true)
    })
  }, [])
  return (
    <div style={card}>
      <h1 style={{ fontSize: 18, marginTop: 0 }}>What this demo proves</h1>
      <p style={muted}>
        This mini-app runs the <b>exact same files</b> as the real CAITO360 app for:
        the Microsoft Graph email sender + templates (lib/email.ts), the Better-Auth
        configuration with required email verification (lib/auth.ts), the auth route
        with its rate limiting, and the same verify-and-return invite mechanics.
        If the flows below work here, the same code will work in the full app.
      </p>
      <ol style={{ fontSize: 14, lineHeight: 1.7 }}>
        <li>Visit <a href="/api/setup">/api/setup</a> once (creates the auth tables).</li>
        <li><a href="/signup">Sign up</a> → verification email arrives → click its link → you land back signed in.</li>
        <li><a href="/login">Log in</a> before verifying → correctly blocked with a resend option.</li>
        <li><a href="/home">Home</a> (after login) → send an <b>invite</b> to another address → that inbox gets the invite email → click → sign up → verify → invitation auto-accepts.</li>
      </ol>
      <div style={{ marginTop: 16 }}>
        {loaded && (me
          ? <span style={muted}>Signed in as <b>{me.email}</b> — <a href="/home">go to home</a></span>
          : <a href="/signup"><button style={btn}>Start: Sign up</button></a>)}
      </div>
    </div>
  )
}

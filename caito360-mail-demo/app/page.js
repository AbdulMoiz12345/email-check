"use client";

import { useState } from "react";

export default function Home() {
  const [codeForm, setCodeForm] = useState({ to: "", code: "123456" });
  const [inviteForm, setInviteForm] = useState({
    to: "",
    inviterName: "Abdul",
    orgName: "CAITO360",
    inviteLink: "https://caito360.ai/invite/demo-token",
  });
  const [codeResult, setCodeResult] = useState(null);
  const [inviteResult, setInviteResult] = useState(null);
  const [loadingCode, setLoadingCode] = useState(false);
  const [loadingInvite, setLoadingInvite] = useState(false);

  async function sendCode(e) {
    e.preventDefault();
    setLoadingCode(true);
    setCodeResult(null);
    try {
      const res = await fetch("/api/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(codeForm),
      });
      const data = await res.json();
      setCodeResult({ ok: res.ok, data });
    } catch (err) {
      setCodeResult({ ok: false, data: { error: err.message } });
    }
    setLoadingCode(false);
  }

  async function sendInvite(e) {
    e.preventDefault();
    setLoadingInvite(true);
    setInviteResult(null);
    try {
      const res = await fetch("/api/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      setInviteResult({ ok: res.ok, data });
    } catch (err) {
      setInviteResult({ ok: false, data: { error: err.message } });
    }
    setLoadingInvite(false);
  }

  return (
    <main
      style={{
        maxWidth: 560,
        margin: "40px auto",
        fontFamily: "system-ui, sans-serif",
        padding: "0 16px",
      }}
    >
      <h1>CAITO360 Mail Test (Microsoft Graph)</h1>
      <p style={{ color: "#64748b" }}>
        Sends real emails via Microsoft Graph using your app registration.
        Set <code>MS_TENANT_ID</code>, <code>MS_CLIENT_ID</code>,{" "}
        <code>MS_CLIENT_SECRET</code>, and <code>MAIL_FROM</code> in your
        Vercel project&apos;s Environment Variables, then redeploy.
      </p>

      <section
        style={{
          marginTop: 32,
          padding: 16,
          border: "1px solid #e2e8f0",
          borderRadius: 8,
        }}
      >
        <h2>1. Verification Code Email</h2>
        <form onSubmit={sendCode}>
          <label>To email:</label>
          <input
            type="email"
            required
            value={codeForm.to}
            onChange={(e) => setCodeForm({ ...codeForm, to: e.target.value })}
            style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
          />
          <label>Code:</label>
          <input
            type="text"
            value={codeForm.code}
            onChange={(e) => setCodeForm({ ...codeForm, code: e.target.value })}
            style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
          />
          <button disabled={loadingCode} type="submit" style={{ padding: "8px 16px" }}>
            {loadingCode ? "Sending..." : "Send Verification Email"}
          </button>
        </form>
        {codeResult && (
          <pre
            style={{
              background: "#f1f5f9",
              padding: 8,
              marginTop: 8,
              whiteSpace: "pre-wrap",
            }}
          >
            {JSON.stringify(codeResult, null, 2)}
          </pre>
        )}
      </section>

      <section
        style={{
          marginTop: 32,
          padding: 16,
          border: "1px solid #e2e8f0",
          borderRadius: 8,
        }}
      >
        <h2>2. Invitation Email</h2>
        <form onSubmit={sendInvite}>
          <label>To email:</label>
          <input
            type="email"
            required
            value={inviteForm.to}
            onChange={(e) => setInviteForm({ ...inviteForm, to: e.target.value })}
            style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
          />
          <label>Inviter name:</label>
          <input
            type="text"
            value={inviteForm.inviterName}
            onChange={(e) =>
              setInviteForm({ ...inviteForm, inviterName: e.target.value })
            }
            style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
          />
          <label>Org name:</label>
          <input
            type="text"
            value={inviteForm.orgName}
            onChange={(e) =>
              setInviteForm({ ...inviteForm, orgName: e.target.value })
            }
            style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
          />
          <label>Invite link:</label>
          <input
            type="text"
            value={inviteForm.inviteLink}
            onChange={(e) =>
              setInviteForm({ ...inviteForm, inviteLink: e.target.value })
            }
            style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}
          />
          <button disabled={loadingInvite} type="submit" style={{ padding: "8px 16px" }}>
            {loadingInvite ? "Sending..." : "Send Invitation Email"}
          </button>
        </form>
        {inviteResult && (
          <pre
            style={{
              background: "#f1f5f9",
              padding: 8,
              marginTop: 8,
              whiteSpace: "pre-wrap",
            }}
          >
            {JSON.stringify(inviteResult, null, 2)}
          </pre>
        )}
      </section>
    </main>
  );
}

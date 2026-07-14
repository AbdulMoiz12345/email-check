import { sendMail } from "../../../lib/graphMail";

export async function POST(request) {
  try {
    const { to, code } = await request.json();

    if (!to || !code) {
      return Response.json({ error: "Missing 'to' or 'code'" }, { status: 400 });
    }

    await sendMail({
      to,
      subject: "Your CAITO360 verification code",
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
          <h2 style="color:#0f172a;">CAITO360 Verification Code</h2>
          <p>Use the code below to verify your email address:</p>
          <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color:#0d9488;">${code}</p>
          <p style="color:#64748b; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
        </div>
      `,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

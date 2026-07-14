import { sendMail } from "../../../lib/graphMail";

export async function POST(request) {
  try {
    const { to, inviterName, orgName, inviteLink } = await request.json();

    if (!to || !inviteLink) {
      return Response.json(
        { error: "Missing 'to' or 'inviteLink'" },
        { status: 400 }
      );
    }

    await sendMail({
      to,
      subject: `${inviterName || "A teammate"} invited you to join ${
        orgName || "their team"
      } on CAITO360`,
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
          <h2 style="color:#0f172a;">You've been invited to CAITO360</h2>
          <p>${inviterName || "A teammate"} has invited you to join <strong>${
        orgName || "their team"
      }</strong> on CAITO360.</p>
          <p style="margin: 24px 0;">
            <a href="${inviteLink}" style="background:#0d9488;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">
              Accept Invitation
            </a>
          </p>
          <p style="color:#64748b; font-size: 13px;">If you weren't expecting this invite, you can ignore this email.</p>
        </div>
      `,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

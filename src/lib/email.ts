import { Resend } from "resend";

/**
 * Send an email via Resend. Reads RESEND_API_KEY from env.
 *
 * Default sender is Resend's onboarding@resend.dev — works with zero domain
 * configuration but shows as "via resend.dev" in many clients. For production,
 * set EMAIL_FROM_ADDRESS to an address on a domain you've verified in Resend.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not set" };
  }

  const fromName = process.env.EMAIL_FROM_NAME || "eventOS";
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev";
  const from = `${fromName} <${fromAddress}>`;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });

  if (error) {
    return { ok: false, error: error.message || "Unknown Resend error" };
  }
  return { ok: true };
}

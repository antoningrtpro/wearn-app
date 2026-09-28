import "server-only";

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM_EMAIL ?? "Wearn <no-reply@wearn.app>";

interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
}

/** Escapes user-controlled strings before interpolating them into an email's
 * HTML body — templates below embed brand-submitted values (company name,
 * contact name) directly, and without this a crafted submission could inject
 * markup into the resulting email. */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Sends a transactional email via Resend. No-ops with a console warning if
 * RESEND_API_KEY isn't configured, so local dev never crashes on this path. */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipping email "${subject}" to`, to);
    return;
  }
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) {
    console.error("[email] Resend error", error);
  }
}

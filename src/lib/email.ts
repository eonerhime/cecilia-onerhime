import { Resend } from "resend";

let client: Resend | null = null;

function getClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  if (!client) client = new Resend(apiKey);
  return client;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("EMAIL_FROM is not configured");
  // The resend SDK resolves with { data, error } on API failures rather
  // than rejecting, so a caller's try/catch would otherwise never see them.
  const { error } = await getClient().emails.send({ from, to, subject, html });
  if (error) throw new Error(error.message || "Resend rejected the email");
}

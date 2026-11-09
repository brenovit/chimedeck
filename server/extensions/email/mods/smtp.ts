// server/extensions/email/mods/smtp.ts
// Generic SMTP sender (Gmail, Outlook, Mailgun, self-hosted Postfix, ...).
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { emailConfig } from '../config';
import type { EmailPayload } from '../types';

type SmtpConfig = typeof emailConfig.smtp;

let transporter: Transporter | null = null;

export function assertSmtpConfig(config: SmtpConfig): void {
  const missing: string[] = [];
  if (!config.host) missing.push('SMTP_HOST');
  if (!config.fromAddress) missing.push('SMTP_FROM_ADDRESS (or SMTP_USER)');
  if (config.user && !config.password) missing.push('SMTP_PASSWORD');
  if (!Number.isFinite(config.port) || config.port <= 0) missing.push('SMTP_PORT');
  if (missing.length > 0) {
    throw new Error(`[email:smtp] EMAIL_PROVIDER=smtp but missing/invalid: ${missing.join(', ')}`);
  }
}

export function createSmtpTransport(config: SmtpConfig): Transporter {
  assertSmtpConfig(config);
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    // Never fall back to plaintext when the server advertises STARTTLS.
    requireTLS: !config.secure,
    // Auth is optional — some internal relays accept unauthenticated mail.
    auth: config.user ? { user: config.user, pass: config.password } : undefined,
  });
}

function getTransporter(): Transporter {
  if (!transporter) transporter = createSmtpTransport(emailConfig.smtp);
  return transporter;
}

export async function sendViaSmtp({ to, subject, html, text }: EmailPayload): Promise<void> {
  await getTransporter().sendMail({
    from: emailConfig.smtp.fromAddress,
    to,
    subject,
    html,
    text,
  });
}

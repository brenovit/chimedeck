// server/extensions/email/config/index.ts
// Centralises all email-related environment variable access and decides which
// provider (SES, SMTP or console) delivers outgoing mail.
import { env } from '../../../config/env';
import { flags } from '../../../mods/flags';
import type { EmailProvider } from '../types';

export const emailConfig = {
  sesRegion: env.SES_REGION,
  sesFromAddress: env.SES_FROM_ADDRESS,
  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    // Implicit TLS for 465 unless explicitly overridden; STARTTLS otherwise.
    secure: env.SMTP_SECURE === '' ? env.SMTP_PORT === 465 : env.SMTP_SECURE === 'true',
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
    fromAddress: env.SMTP_FROM_ADDRESS || env.SMTP_USER,
  },
} as const;

const VALID_PROVIDERS: readonly EmailProvider[] = ['ses', 'smtp', 'console'];
let warnedInvalidProvider = false;

/**
 * Resolve the active email provider.
 *
 * EMAIL_PROVIDER=ses|smtp|console wins when set. When unset (or invalid) we keep
 * the legacy behaviour so existing deployments are unaffected: SES when the
 * SES_ENABLED flag is on, otherwise console.
 */
export async function resolveEmailProvider(
  rawProvider: string = env.EMAIL_PROVIDER,
  isSesFlagEnabled: () => Promise<boolean> = () => flags.isEnabled('SES_ENABLED'),
): Promise<EmailProvider> {
  if (rawProvider !== '') {
    if ((VALID_PROVIDERS as readonly string[]).includes(rawProvider)) {
      return rawProvider as EmailProvider;
    }
    if (!warnedInvalidProvider) {
      warnedInvalidProvider = true;
      console.warn(
        `[email] Unknown EMAIL_PROVIDER "${rawProvider}" — expected one of ${VALID_PROVIDERS.join(', ')}. ` +
          'Falling back to FLAG_SES_ENABLED.',
      );
    }
  }
  return (await isSesFlagEnabled()) ? 'ses' : 'console';
}

/**
 * True when a real delivery provider (SES or SMTP) is active. This replaces the
 * old `SES_ENABLED` checks that gate invite, notification and verification emails.
 */
export async function isEmailDeliveryEnabled(): Promise<boolean> {
  return (await resolveEmailProvider()) !== 'console';
}

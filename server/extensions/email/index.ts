// server/extensions/email/index.ts
// Routes email to AWS SES, SMTP or the console based on EMAIL_PROVIDER
// (falling back to the SES_ENABLED flag when EMAIL_PROVIDER is unset).
import { resolveEmailProvider, isEmailDeliveryEnabled } from './config';
import { sendViaSes } from './mods/ses';
import { sendViaSmtp } from './mods/smtp';
import { sendViaConsole } from './mods/console';
import type { EmailPayload } from './types';

export type { EmailPayload, EmailProvider } from './types';
export { isEmailDeliveryEnabled, resolveEmailProvider };

export async function send(payload: EmailPayload): Promise<void> {
  const provider = await resolveEmailProvider();
  switch (provider) {
    case 'ses':
      return sendViaSes(payload);
    case 'smtp':
      return sendViaSmtp(payload);
    default:
      return sendViaConsole(payload);
  }
}

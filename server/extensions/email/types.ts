// server/extensions/email/types.ts
// Shared payload shape for every email provider.

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export type EmailProvider = 'ses' | 'smtp' | 'console';

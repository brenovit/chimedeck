// server/extensions/email/mods/ses.ts
// AWS SES v3 SDK email sending wrapper.
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { emailConfig } from '../config';
import { env } from '../../../config/env';
import type { EmailPayload } from '../types';

const sesClient = new SESClient({
  region: emailConfig.sesRegion,
  // Intentionally uses global AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY (not the
  // S3_AWS_* variants). SES must authenticate against real AWS even when S3 is
  // pointed at LocalStack via S3_AWS_ACCESS_KEY_ID.
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export type { EmailPayload };

export async function sendViaSes({ to, subject, html, text }: EmailPayload): Promise<void> {
  await sesClient.send(
    new SendEmailCommand({
      Source: emailConfig.sesFromAddress,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: html, Charset: 'UTF-8' },
          Text: { Data: text, Charset: 'UTF-8' },
        },
      },
    })
  );
}

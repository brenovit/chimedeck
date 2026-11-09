# Email delivery

Chimedeck sends email for account verification, password resets, email changes,
admin invites and card notifications. Pick a delivery provider with
`EMAIL_PROVIDER`:

| `EMAIL_PROVIDER` | What happens |
| --- | --- |
| `smtp` | Sends through any SMTP server (Gmail, Outlook/Office 365, Mailgun, SendGrid, Postfix, ...). |
| `ses` | Sends through AWS SES (`SES_REGION`, `SES_FROM_ADDRESS`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`). |
| `console` | Logs emails to stdout instead of sending them. Useful for local dev. |
| _(unset)_ | Legacy behaviour: SES when `FLAG_SES_ENABLED=true`, otherwise console. Existing deployments keep working unchanged. |

When the provider is `smtp` or `ses`, email delivery counts as enabled for every
feature that used to depend on `FLAG_SES_ENABLED` (admin invite emails,
notification emails, the email toggles in the UI). Those features still have
their own switches: `FLAG_EMAIL_VERIFICATION_ENABLED`,
`ADMIN_INVITE_EMAIL_ENABLED` and `FLAG_EMAIL_NOTIFICATIONS_ENABLED`.

## SMTP settings

| Variable | Default | Notes |
| --- | --- | --- |
| `SMTP_HOST` | _(required)_ | e.g. `smtp.gmail.com` |
| `SMTP_PORT` | `587` | `587` for STARTTLS, `465` for implicit TLS |
| `SMTP_SECURE` | auto | `true` = implicit TLS, `false` = STARTTLS. Unset picks `true` only for port 465. STARTTLS is required (no plaintext fallback). |
| `SMTP_USER` | _(empty)_ | Leave empty for relays that don't require auth |
| `SMTP_PASSWORD` | _(empty)_ | Required when `SMTP_USER` is set |
| `SMTP_FROM_ADDRESS` | `SMTP_USER` | Accepts `Chimedeck <you@example.com>` |

## Gmail setup

Gmail no longer accepts your normal account password over SMTP. Use an App Password:

1. Turn on 2-Step Verification for the Google account
   (Google Account → Security → 2-Step Verification).
2. Open <https://myaccount.google.com/apppasswords>, create an app password
   (name it e.g. "Chimedeck") and copy the 16-character code.
3. Add this to `.env` and restart the app:

   ```bash
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=you@gmail.com
   SMTP_PASSWORD=abcdefghijklmnop   # the App Password, spaces optional
   SMTP_FROM_ADDRESS="Chimedeck <you@gmail.com>"
   ```

Notes:

- Gmail rewrites the `From` address to the authenticated account unless you have
  added the other address as a verified "Send mail as" alias in Gmail settings.
- Free Gmail accounts are limited to roughly 500 recipients per day
  (Google Workspace: about 2,000). That's fine for a small self-hosted team; use
  a transactional provider for anything larger.
- Google Workspace accounts may need an admin to allow App Passwords.

## Other providers

| Provider | `SMTP_HOST` | `SMTP_PORT` | `SMTP_USER` |
| --- | --- | --- | --- |
| Outlook / Office 365 | `smtp.office365.com` | `587` | your mailbox address |
| Mailgun | `smtp.mailgun.org` | `587` | SMTP login from the Mailgun dashboard |
| SendGrid | `smtp.sendgrid.net` | `587` | `apikey` (password is the API key) |
| AWS SES via SMTP | `email-smtp.<region>.amazonaws.com` | `587` | SES SMTP credentials |

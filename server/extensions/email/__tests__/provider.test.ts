import { beforeEach, describe, expect, it } from 'bun:test';
import { resolveEmailProvider as resolve } from '../config';
import { assertSmtpConfig, createSmtpTransport } from '../mods/smtp';

let sesFlag = false;
const resolveEmailProvider = (raw: string) => resolve(raw, async () => sesFlag);

const baseSmtp = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  user: 'someone@gmail.com',
  password: 'abcd efgh ijkl mnop',
  fromAddress: 'someone@gmail.com',
};

describe('resolveEmailProvider', () => {
  beforeEach(() => {
    sesFlag = false;
  });

  it('uses EMAIL_PROVIDER when set to smtp, even if SES_ENABLED is on', async () => {
    sesFlag = true;
    expect(await resolveEmailProvider('smtp')).toBe('smtp');
  });

  it('honours ses and console explicitly', async () => {
    expect(await resolveEmailProvider('ses')).toBe('ses');
    sesFlag = true;
    expect(await resolveEmailProvider('console')).toBe('console');
  });

  it('falls back to SES when EMAIL_PROVIDER is unset and SES_ENABLED is on', async () => {
    sesFlag = true;
    expect(await resolveEmailProvider('')).toBe('ses');
  });

  it('falls back to console when EMAIL_PROVIDER is unset and SES_ENABLED is off', async () => {
    expect(await resolveEmailProvider('')).toBe('console');
  });

  it('treats an unknown provider like unset', async () => {
    expect(await resolveEmailProvider('mailgun')).toBe('console');
    sesFlag = true;
    expect(await resolveEmailProvider('mailgun')).toBe('ses');
  });
});

describe('SMTP config', () => {
  it('accepts a complete Gmail config', () => {
    expect(() => assertSmtpConfig(baseSmtp)).not.toThrow();
  });

  it('reports missing host and password', () => {
    expect(() => assertSmtpConfig({ ...baseSmtp, host: '', password: '' })).toThrow(
      /SMTP_HOST.*SMTP_PASSWORD/,
    );
  });

  it('reports a missing from address', () => {
    expect(() => assertSmtpConfig({ ...baseSmtp, user: '', fromAddress: '' })).toThrow(
      /SMTP_FROM_ADDRESS/,
    );
  });

  it('allows unauthenticated relays (no user, no password)', () => {
    expect(() =>
      assertSmtpConfig({ ...baseSmtp, user: '', password: '', fromAddress: 'app@local' }),
    ).not.toThrow();
  });

  it('builds a STARTTLS transport with auth for port 587', () => {
    const t = createSmtpTransport(baseSmtp);
    const opts = t.options as Record<string, unknown>;
    expect(opts.host).toBe('smtp.gmail.com');
    expect(opts.port).toBe(587);
    expect(opts.secure).toBe(false);
    expect(opts.requireTLS).toBe(true);
    expect(opts.auth).toEqual({ user: baseSmtp.user, pass: baseSmtp.password });
  });

  it('builds an implicit-TLS transport without auth when user is empty', () => {
    const t = createSmtpTransport({ ...baseSmtp, port: 465, secure: true, user: '', password: '' });
    const opts = t.options as Record<string, unknown>;
    expect(opts.secure).toBe(true);
    expect(opts.requireTLS).toBe(false);
    expect(opts.auth).toBeUndefined();
  });
});

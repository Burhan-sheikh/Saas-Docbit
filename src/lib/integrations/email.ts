import { supabase } from '@/lib/supabase/client';

type EmailTemplate =
  | 'project_invite'
  | 'permission_approved'
  | 'permission_denied'
  | 'storage_limit'
  | 'plan_changed'
  | 'link_shared';

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Sends a templated transactional email through the Resend-backed Netlify function. */
export async function sendEmail(to: string | string[], template: EmailTemplate, data: Record<string, string>) {
  const headers = await authHeader();
  const res = await fetch('/.netlify/functions/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ to, template, data }),
  });
  if (!res.ok) {
    // Non-fatal: notification in-app is the source of truth, email is best-effort.
    // eslint-disable-next-line no-console
    console.warn('Email send failed', await res.text());
  }
}

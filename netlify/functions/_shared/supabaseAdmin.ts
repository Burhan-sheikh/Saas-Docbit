import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Verifies the bearer token from an incoming request and returns the user id.
 * Throws if the token is missing or invalid.
 */
export async function requireUser(authHeader: string | undefined | null): Promise<string> {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('UNAUTHORIZED');
  }
  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    throw new Error('UNAUTHORIZED');
  }
  return data.user.id;
}

export function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

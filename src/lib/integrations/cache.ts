import { supabase } from '@/lib/supabase/client';

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Thin client for the Upstash-Redis-backed cache Netlify function. Used for expensive rollups. */
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const headers = await authHeader();
    const res = await fetch(`/.netlify/functions/cache?key=${encodeURIComponent(key)}`, { headers });
    if (!res.ok) return null;
    const { value } = await res.json();
    return (value as T) ?? null;
  },
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const headers = await authHeader();
    await fetch('/.netlify/functions/cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ key, value, ttl: ttlSeconds }),
    });
  },
  async invalidate(key: string): Promise<void> {
    const headers = await authHeader();
    await fetch(`/.netlify/functions/cache?key=${encodeURIComponent(key)}`, { method: 'DELETE', headers });
  },
};

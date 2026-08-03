import type { Handler } from '@netlify/functions';
import { Redis } from '@upstash/redis';
import { requireUser, jsonResponse } from './_shared/supabaseAdmin';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL as string,
  token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
});

/**
 * Generic cache proxy used for expensive read-heavy queries
 * (workspace stats, project stats, analytics rollups).
 * GET  ?key=...            -> returns cached value or null
 * POST { key, value, ttl } -> sets cached value with optional TTL (seconds)
 * DELETE ?key=...          -> invalidates a cache key
 */
export const handler: Handler = async (event) => {
  try {
    await requireUser(event.headers.authorization);

    if (event.httpMethod === 'GET') {
      const key = event.queryStringParameters?.key;
      if (!key) return jsonResponse(400, { error: 'key is required' });
      const value = await redis.get(key);
      return jsonResponse(200, { value });
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}') as { key: string; value: unknown; ttl?: number };
      if (!body.key) return jsonResponse(400, { error: 'key is required' });
      if (body.ttl) {
        await redis.set(body.key, body.value, { ex: body.ttl });
      } else {
        await redis.set(body.key, body.value);
      }
      return jsonResponse(200, { ok: true });
    }

    if (event.httpMethod === 'DELETE') {
      const key = event.queryStringParameters?.key;
      if (!key) return jsonResponse(400, { error: 'key is required' });
      await redis.del(key);
      return jsonResponse(200, { ok: true });
    }

    return jsonResponse(405, { error: 'Method not allowed' });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return jsonResponse(401, { error: 'Unauthorized' });
    }
    return jsonResponse(500, { error: 'Cache operation failed' });
  }
};

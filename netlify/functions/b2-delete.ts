import type { Handler } from '@netlify/functions';
import { S3Client, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { requireUser, jsonResponse } from './_shared/supabaseAdmin';

const s3 = new S3Client({
  endpoint: process.env.VITE_B2_ENDPOINT,
  region: process.env.VITE_B2_REGION || 'us-west-002',
  credentials: {
    accessKeyId: process.env.B2_KEY_ID as string,
    secretAccessKey: process.env.B2_APPLICATION_KEY as string,
  },
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    await requireUser(event.headers.authorization);
    const body = JSON.parse(event.body || '{}') as { key?: string; keys?: string[] };

    if (body.keys && body.keys.length > 0) {
      await s3.send(
        new DeleteObjectsCommand({
          Bucket: process.env.VITE_B2_BUCKET_NAME,
          Delete: { Objects: body.keys.map((Key) => ({ Key })) },
        })
      );
      return jsonResponse(200, { deleted: body.keys.length });
    }

    if (body.key) {
      await s3.send(new DeleteObjectCommand({ Bucket: process.env.VITE_B2_BUCKET_NAME, Key: body.key }));
      return jsonResponse(200, { deleted: 1 });
    }

    return jsonResponse(400, { error: 'key or keys is required' });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return jsonResponse(401, { error: 'Unauthorized' });
    }
    return jsonResponse(500, { error: 'Failed to delete object(s)' });
  }
};

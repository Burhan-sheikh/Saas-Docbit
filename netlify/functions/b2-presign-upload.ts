import type { Handler } from '@netlify/functions';
import { randomUUID } from 'node:crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { requireUser, jsonResponse } from './_shared/supabaseAdmin';

const s3 = new S3Client({
  endpoint: process.env.VITE_B2_ENDPOINT,
  region: process.env.VITE_B2_REGION || 'us-west-002',
  credentials: {
    accessKeyId: process.env.B2_KEY_ID as string,
    secretAccessKey: process.env.B2_APPLICATION_KEY as string,
  },
});

interface PresignBody {
  projectId: string;
  fileName: string;
  contentType: string;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const userId = await requireUser(event.headers.authorization);
    const body = JSON.parse(event.body || '{}') as PresignBody;

    if (!body.projectId || !body.fileName || !body.contentType) {
      return jsonResponse(400, { error: 'projectId, fileName and contentType are required' });
    }

    const safeName = body.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `projects/${body.projectId}/${Date.now()}-${randomUUID()}-${safeName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.VITE_B2_BUCKET_NAME,
      Key: key,
      ContentType: body.contentType,
      Metadata: { uploadedBy: userId },
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
    const publicUrl = `${process.env.VITE_B2_ENDPOINT}/${process.env.VITE_B2_BUCKET_NAME}/${key}`;

    return jsonResponse(200, { uploadUrl, key, publicUrl });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return jsonResponse(401, { error: 'Unauthorized' });
    }
    return jsonResponse(500, { error: 'Failed to generate upload URL' });
  }
};

import { supabase } from '@/lib/supabase/client';

interface PresignResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Requests a presigned Backblaze B2 upload URL from the Netlify function,
 * then uploads the file directly to B2 from the browser (no proxying through our server).
 */
export async function uploadFileToB2(
  projectId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ key: string; publicUrl: string }> {
  const headers = await authHeader();

  const presignRes = await fetch('/.netlify/functions/b2-presign-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ projectId, fileName: file.name, contentType: file.type || 'application/octet-stream' }),
  });

  if (!presignRes.ok) {
    throw new Error('Failed to prepare upload');
  }

  const { uploadUrl, key, publicUrl } = (await presignRes.json()) as PresignResponse;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable && onProgress) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Upload failed')));
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(file);
  });

  return { key, publicUrl };
}

export async function deleteFilesFromB2(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const headers = await authHeader();
  await fetch('/.netlify/functions/b2-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ keys }),
  });
}

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Lock, Download, FolderOpen, AlertTriangle, LogIn } from 'lucide-react';
import { linksApi } from '@/lib/api/links';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, FullPageSpinner, EmptyState, Badge } from '@/components/ui';
import { FileIcon } from '@/components/files/FileIcon';
import { formatBytes } from '@/utils/format';
import type { FileNode } from '@/types/database';

type LinkResolution = Awaited<ReturnType<typeof linksApi.resolvePublic>>;

export function PublicSharePage() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();

  const [link, setLink] = useState<LinkResolution | null>(null);
  const [contents, setContents] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      try {
        const resolved = await linksApi.resolvePublic(slug);
        if (!resolved || !resolved.is_active || resolved.expired || resolved.downloads_exhausted) {
          setNotFound(true);
          return;
        }
        setLink(resolved);
        if (!resolved.requires_password) {
          setUnlocked(true);
          await loadContents();
        }
        await linksApi.recordEvent(slug, 'link_view');
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const loadContents = async () => {
    if (!slug) return;
    const data = await linksApi.resolvePublicContents(slug);
    setContents(data as unknown as FileNode[]);
  };

  const handleUnlock = async () => {
    if (!slug) return;
    const valid = await linksApi.verifyPassword(slug, passwordInput);
    if (valid) {
      setUnlocked(true);
      setPasswordError('');
      await loadContents();
    } else {
      setPasswordError('Incorrect password');
    }
  };

  const handleDownload = async (node: FileNode) => {
    if (!slug || !node.storage_url) return;
    await linksApi.recordEvent(slug, 'link_download');
    window.open(node.storage_url, '_blank');
  };

  if (loading) return <FullPageSpinner />;

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
          <h1 className="text-lg font-semibold text-gray-900">This link is unavailable</h1>
          <p className="mt-1 text-sm text-gray-500">It may have expired, reached its download limit, or been disabled.</p>
        </div>
      </div>
    );
  }

  if (link?.require_login && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <LogIn className="mx-auto mb-3 h-8 w-8 text-brand-600" />
          <h1 className="text-base font-semibold text-gray-900">Sign in required</h1>
          <p className="mt-1 text-sm text-gray-500">The owner of this link requires you to sign in before viewing.</p>
          <a href={`/login?from=/s/${slug}`}>
            <Button className="mt-4" fullWidth>Sign in</Button>
          </a>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <Lock className="mx-auto mb-3 h-8 w-8 text-brand-600" />
          <h1 className="text-base font-semibold text-gray-900">Password protected</h1>
          <p className="mt-1 text-sm text-gray-500">Enter the password to view this content.</p>
          <div className="mt-4 space-y-2 text-left">
            <Input type="password" placeholder="Password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} error={passwordError} />
            <Button fullWidth onClick={handleUnlock}>Unlock</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">S</div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{link?.project_name}</h1>
            <p className="text-xs text-gray-500">Shared via SaaS Platform · <Badge variant="gray" className="capitalize">{link?.permission}</Badge></p>
          </div>
        </div>

        {contents.length === 0 ? (
          <EmptyState icon={<FolderOpen className="h-5 w-5" />} title="Nothing to show" description="This shared content is empty." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {contents.filter((n) => n.type === 'file').map((node) => (
              <div key={node.id} className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0">
                <FileIcon type={node.type} category={node.category} className="h-9 w-9 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">{node.name}</p>
                  <p className="text-xs text-gray-400">{formatBytes(node.size_bytes)}</p>
                </div>
                {link?.permission === 'download' && (
                  <Button size="sm" variant="outline" onClick={() => handleDownload(node)}>
                    <Download className="h-3.5 w-3.5" /> Download
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

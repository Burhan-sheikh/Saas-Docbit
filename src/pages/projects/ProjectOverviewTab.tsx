import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Link2, Users, HardDrive, Upload, UserPlus, Share2, Settings } from 'lucide-react';
import { useProject, useProjectStats } from '@/hooks/useProjects';
import { useProjectMembers } from '@/hooks/useMembers';
import { useActivityLogs } from '@/hooks/useActivity';
import { useFileNodes } from '@/hooks/useFiles';
import { useLinks } from '@/hooks/useLinks';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivityList } from '@/components/dashboard/RecentActivityList';
import { StorageUsageCard } from '@/components/dashboard/StorageUsageCard';
import { Avatar, Badge, EmptyState, SkeletonStatCard } from '@/components/ui';
import { useMySubscription } from '@/hooks/useBilling';
import { formatBytes, formatRelativeTime } from '@/utils/format';

export function ProjectOverviewTab() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: project } = useProject(projectId);
  const { data: stats, isLoading: statsLoading } = useProjectStats(projectId);
  const { data: members } = useProjectMembers(projectId);
  const { data: logs, isLoading: logsLoading } = useActivityLogs('project', projectId);
  const { data: rootFiles } = useFileNodes(projectId, null);
  const { data: links } = useLinks(projectId);
  const { data: subscription } = useMySubscription();

  const recentFiles = (rootFiles ?? [])
    .filter((f) => f.type === 'file')
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const recentLinks = (links ?? []).slice(0, 4);

  const quickActions = [
    { label: 'Upload files', icon: Upload, onClick: () => navigate(`/projects/${projectId}/data`) },
    { label: 'Invite members', icon: UserPlus, onClick: () => navigate(`/projects/${projectId}/members`) },
    { label: 'Create share link', icon: Share2, onClick: () => navigate(`/projects/${projectId}/sharing`) },
    { label: 'Project settings', icon: Settings, onClick: () => navigate(`/projects/${projectId}/settings`) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard label="Files" value={String(stats?.file_count ?? 0)} icon={<FileText className="h-4 w-4" />} accent="brand" />
            <StatCard label="Members" value={String(stats?.member_count ?? 0)} icon={<Users className="h-4 w-4" />} accent="purple" />
            <StatCard label="Active links" value={String(stats?.link_count ?? 0)} icon={<Link2 className="h-4 w-4" />} accent="amber" />
            <StatCard label="Storage" value={formatBytes(stats?.storage_used_bytes ?? 0)} icon={<HardDrive className="h-4 w-4" />} accent="emerald" />
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((action) => (
          <button key={action.label} onClick={action.onClick} className="card flex flex-col items-center gap-2 p-4 text-center hover:border-brand-300 hover:bg-brand-50/40">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <action.icon className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium text-gray-700">{action.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Recent uploads</h2>
            {recentFiles.length === 0 ? (
              <EmptyState icon={<FileText className="h-5 w-5" />} title="No files uploaded yet" className="border-none py-6" />
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentFiles.map((f) => (
                  <li key={f.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="truncate text-gray-800">{f.name}</span>
                    <span className="shrink-0 text-xs text-gray-400">{formatRelativeTime(f.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Recent activity</h2>
            <RecentActivityList logs={logs} isLoading={logsLoading} />
          </div>
        </div>

        <div className="space-y-6">
          <StorageUsageCard usedBytes={stats?.storage_used_bytes ?? 0} maxBytes={subscription?.plan?.max_storage_bytes ?? 5368709120} />

          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Members</h2>
            {members && members.length > 0 ? (
              <ul className="space-y-2.5">
                {members.filter((m) => m.accepted).slice(0, 5).map((m) => (
                  <li key={m.id} className="flex items-center gap-2.5">
                    <Avatar name={m.profile?.full_name} email={m.profile?.email} src={m.profile?.avatar_url} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-gray-800">{m.profile?.full_name || m.profile?.email}</p>
                    </div>
                    <Badge variant="gray" className="capitalize">{m.role}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400">No members yet.</p>
            )}
          </div>

          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Recent links</h2>
            {recentLinks.length > 0 ? (
              <ul className="space-y-2">
                {recentLinks.map((l) => (
                  <li key={l.id} className="flex items-center justify-between text-xs">
                    <span className="truncate font-mono text-gray-600">/{l.slug}</span>
                    <Badge variant={l.is_active ? 'green' : 'gray'}>{l.is_active ? 'Active' : 'Disabled'}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400">No share links yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

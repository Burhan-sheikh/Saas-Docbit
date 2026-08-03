import { useState } from 'react';
import { FolderKanban, Building2, HardDrive, Link2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useRecentProjects } from '@/hooks/useProjects';
import { useUsageSummary, useMySubscription } from '@/hooks/useBilling';
import { useActivityLogs } from '@/hooks/useActivity';
import { StatCard } from '@/components/dashboard/StatCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivityList } from '@/components/dashboard/RecentActivityList';
import { RecentProjectsList } from '@/components/dashboard/RecentProjectsList';
import { StorageUsageCard } from '@/components/dashboard/StorageUsageCard';
import { NotificationsPreview } from '@/components/notifications/NotificationsPreview';
import { CreateWorkspaceModal } from '@/components/workspaces/CreateWorkspaceModal';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { SkeletonStatCard } from '@/components/ui';
import { formatBytes } from '@/utils/format';

export function OverviewPage() {
  const { profile } = useAuth();
  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces({ status: 'active' });
  const { data: recentProjects, isLoading: projectsLoading } = useRecentProjects();
  const { data: usage, isLoading: usageLoading } = useUsageSummary();
  const { data: subscription } = useMySubscription();
  const { data: logs, isLoading: logsLoading } = useActivityLogs('workspace', workspaces?.[0]?.id);

  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  const totalProjects = workspaces?.reduce((sum, w) => sum + w.stats.project_count, 0) ?? 0;
  const totalLinks = 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-1 text-sm text-gray-500">Here's what's happening across your workspaces.</p>
      </div>

      <QuickActions onCreateWorkspace={() => setCreateWorkspaceOpen(true)} onCreateProject={() => setCreateProjectOpen(true)} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {workspacesLoading || usageLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard label="Workspaces" value={String(workspaces?.length ?? 0)} icon={<Building2 className="h-4 w-4" />} accent="brand" />
            <StatCard label="Active projects" value={String(totalProjects)} icon={<FolderKanban className="h-4 w-4" />} accent="purple" />
            <StatCard label="Storage used" value={formatBytes(usage?.storageUsedBytes ?? 0)} icon={<HardDrive className="h-4 w-4" />} accent="emerald" />
            <StatCard label="Active links" value={String(totalLinks)} icon={<Link2 className="h-4 w-4" />} accent="amber" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Recent projects</h2>
            </div>
            <RecentProjectsList projects={recentProjects} isLoading={projectsLoading} />
          </div>

          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Recent activity</h2>
            <RecentActivityList logs={logs} isLoading={logsLoading} />
          </div>
        </div>

        <div className="space-y-6">
          <StorageUsageCard
            usedBytes={usage?.storageUsedBytes ?? 0}
            maxBytes={subscription?.plan?.max_storage_bytes ?? 5368709120}
            isLoading={usageLoading}
          />

          <div className="card overflow-hidden">
            <NotificationsPreview onNavigate={() => {}} />
          </div>
        </div>
      </div>

      <CreateWorkspaceModal isOpen={createWorkspaceOpen} onClose={() => setCreateWorkspaceOpen(false)} />
      <CreateProjectModal isOpen={createProjectOpen} onClose={() => setCreateProjectOpen(false)} />
    </div>
  );
}

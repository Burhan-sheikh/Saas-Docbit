import { Activity } from 'lucide-react';
import { Avatar, EmptyState, Skeleton } from '@/components/ui';
import { formatRelativeTime } from '@/utils/format';
import type { ActivityLog } from '@/types/database';

const ACTION_LABELS: Record<string, string> = {
  project_created: 'created project',
  project_renamed: 'renamed project',
  project_archived: 'archived project',
  workspace_created: 'created workspace',
  file_uploaded: 'uploaded a file',
  file_deleted: 'deleted a file',
  folder_created: 'created a folder',
  link_created: 'generated a share link',
  member_invited: 'invited a member',
};

export function RecentActivityList({ logs, isLoading }: { logs?: ActivityLog[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-3.5 flex-1" />
          </div>
        ))}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return <EmptyState icon={<Activity className="h-5 w-5" />} title="No recent activity" description="Activity across your workspaces will show up here." />;
  }

  return (
    <ul className="space-y-1">
      {logs.map((log) => (
        <li key={log.id} className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-gray-50">
          <Avatar name={log.actor?.full_name} email={log.actor?.email} src={log.actor?.avatar_url} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-700">
              <span className="font-medium text-gray-900">{log.actor?.full_name || log.actor?.email || 'Someone'}</span>{' '}
              {ACTION_LABELS[log.action] || log.action}
            </p>
            <p className="text-xs text-gray-400">{formatRelativeTime(log.created_at)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

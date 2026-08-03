import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from '@/hooks/useNotifications';
import { Button, EmptyState, Skeleton } from '@/components/ui';
import { NotificationIcon } from '@/components/notifications/NotificationIcon';
import { formatRelativeTime } from '@/utils/format';
import { cn } from '@/utils/cn';

export function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
        <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
          <CheckCheck className="h-3.5 w-3.5" /> Mark all read
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : !notifications || notifications.length === 0 ? (
        <EmptyState icon={<Bell className="h-5 w-5" />} title="No notifications" description="You're all caught up." />
      ) : (
        <div className="space-y-1.5">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => { markRead.mutate(n.id); if (n.link) navigate(n.link); }}
              className={cn('flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors hover:border-brand-300', n.is_read ? 'border-gray-200 bg-white' : 'border-brand-200 bg-brand-50/40')}
            >
              <NotificationIcon type={n.type} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                <p className="text-sm text-gray-500">{n.message}</p>
                <p className="mt-0.5 text-xs text-gray-400">{formatRelativeTime(n.created_at)}</p>
              </div>
              {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { notificationsApi } from '@/lib/api/notifications';
import { queryKeys } from './queryKeys';
import { useAuth } from '@/context/AuthContext';
import type { Notification } from '@/types/database';

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.notifications(user?.id ?? ''),
    queryFn: () => notificationsApi.list(user!.id),
    enabled: Boolean(user?.id),
  });
}

export function useUnreadCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.unreadCount(user?.id ?? ''),
    queryFn: () => notificationsApi.unreadCount(user!.id),
    enabled: Boolean(user?.id),
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications(user?.id ?? '') });
      qc.invalidateQueries({ queryKey: queryKeys.unreadCount(user?.id ?? '') });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(user!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications(user?.id ?? '') });
      qc.invalidateQueries({ queryKey: queryKeys.unreadCount(user?.id ?? '') });
      toast.success('All notifications marked as read');
    },
  });
}

/** Subscribes to realtime notification inserts and shows a toast + refreshes the list. */
export function useRealtimeNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = notificationsApi.subscribe(user.id, (notification: Notification) => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications(user.id) });
      qc.invalidateQueries({ queryKey: queryKeys.unreadCount(user.id) });
      toast(notification.title, { icon: '🔔' });
    });
    return unsubscribe;
  }, [user?.id, qc]);
}

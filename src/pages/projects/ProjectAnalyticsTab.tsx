import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Eye, Download, Upload, Globe2 } from 'lucide-react';
import { useProjectAnalytics, useActivityLogs } from '@/hooks/useActivity';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivityList } from '@/components/dashboard/RecentActivityList';
import { EmptyState, Skeleton } from '@/components/ui';
import { format } from 'date-fns';

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];

export function ProjectAnalyticsTab() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: events, isLoading } = useProjectAnalytics(projectId, 30);
  const { data: logs, isLoading: logsLoading } = useActivityLogs('project', projectId, 15);

  const summary = useMemo(() => {
    const list = events ?? [];
    return {
      views: list.filter((e) => e.event_type === 'project_view' || e.event_type === 'link_view').length,
      uploads: list.filter((e) => e.event_type === 'file_upload').length,
      downloads: list.filter((e) => e.event_type === 'file_download' || e.event_type === 'link_download').length,
    };
  }, [events]);

  const dailySeries = useMemo(() => {
    const list = events ?? [];
    const byDay = new Map<string, { date: string; views: number; downloads: number; uploads: number }>();
    list.forEach((e) => {
      const day = format(new Date(e.created_at), 'MMM d');
      const entry = byDay.get(day) ?? { date: day, views: 0, downloads: 0, uploads: 0 };
      if (e.event_type === 'project_view' || e.event_type === 'link_view') entry.views++;
      if (e.event_type === 'file_download' || e.event_type === 'link_download') entry.downloads++;
      if (e.event_type === 'file_upload') entry.uploads++;
      byDay.set(day, entry);
    });
    return Array.from(byDay.values());
  }, [events]);

  const deviceBreakdown = useMemo(() => {
    const list = events ?? [];
    const byDevice = new Map<string, number>();
    list.forEach((e) => {
      const key = e.device || 'Unknown';
      byDevice.set(key, (byDevice.get(key) ?? 0) + 1);
    });
    return Array.from(byDevice.entries()).map(([name, value]) => ({ name, value }));
  }, [events]);

  const countryBreakdown = useMemo(() => {
    const list = events ?? [];
    const byCountry = new Map<string, number>();
    list.forEach((e) => {
      const key = e.country || 'Unknown';
      byCountry.set(key, (byCountry.get(key) ?? 0) + 1);
    });
    return Array.from(byCountry.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [events]);

  if (isLoading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}</div>;
  }

  const hasData = (events ?? []).length > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Views (30d)" value={String(summary.views)} icon={<Eye className="h-4 w-4" />} accent="brand" />
        <StatCard label="Uploads (30d)" value={String(summary.uploads)} icon={<Upload className="h-4 w-4" />} accent="purple" />
        <StatCard label="Downloads (30d)" value={String(summary.downloads)} icon={<Download className="h-4 w-4" />} accent="emerald" />
      </div>

      {!hasData ? (
        <EmptyState icon={<Globe2 className="h-5 w-5" />} title="No analytics yet" description="Views, uploads and downloads will show up here once your project gets activity." />
      ) : (
        <>
          <div className="card p-4">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Activity over time</h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dailySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="views" stackId="1" stroke="#2563eb" fill="#2563eb33" name="Views" />
                <Area type="monotone" dataKey="uploads" stackId="1" stroke="#7c3aed" fill="#7c3aed33" name="Uploads" />
                <Area type="monotone" dataKey="downloads" stackId="1" stroke="#059669" fill="#05966933" name="Downloads" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card p-4">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">Top countries</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={countryBreakdown} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-4">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">Devices</h2>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={deviceBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {deviceBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      <div className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Recent events</h2>
        <RecentActivityList logs={logs} isLoading={logsLoading} />
      </div>
    </div>
  );
}

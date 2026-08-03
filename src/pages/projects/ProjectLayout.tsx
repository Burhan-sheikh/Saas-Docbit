import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FolderKanban } from 'lucide-react';
import { useProject } from '@/hooks/useProjects';
import { useProjectPermissions } from '@/hooks/usePermissions';
import { Tabs, FullPageSpinner, Badge } from '@/components/ui';

const TABS = [
  { value: '', label: 'Overview' },
  { value: 'data', label: 'Data' },
  { value: 'sharing', label: 'Sharing' },
  { value: 'members', label: 'Members' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'settings', label: 'Settings' },
];

export function ProjectLayout() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { role, hasAccess, isLoading: permsLoading } = useProjectPermissions(projectId);
  const navigate = useNavigate();
  const location = useLocation();

  const isLoading = projectLoading || permsLoading;
  const activeTab = location.pathname.split('/')[3] || '';

  useEffect(() => {
    if (!isLoading && !hasAccess) {
      navigate(`/projects/${projectId}/access-denied`, { replace: true });
    }
  }, [isLoading, hasAccess, navigate, projectId]);

  if (isLoading) return <FullPageSpinner />;
  if (!project || !hasAccess) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
            {project.description && <p className="text-sm text-gray-500">{project.description}</p>}
          </div>
        </div>
        {role && <Badge variant="brand" className="capitalize">{role}</Badge>}
      </div>

      <Tabs tabs={TABS} value={activeTab} onChange={(v) => navigate(`/projects/${projectId}${v ? `/${v}` : ''}`)} />

      <Outlet />
    </div>
  );
}

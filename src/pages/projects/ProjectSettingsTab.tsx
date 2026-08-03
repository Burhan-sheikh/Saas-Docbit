import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';
import { useProject, useRenameProject, useUpdateProjectDetails, useMoveProject, useArchiveProject, useRestoreProject, useDeleteProject } from '@/hooks/useProjects';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useProjectPermissions } from '@/hooks/usePermissions';
import { Input, Textarea, Select, Button, Card, CardHeader, CardBody, ConfirmDialog } from '@/components/ui';
import { renameSchema } from '@/utils/validation';
import type { z } from 'zod';

const ICON_OPTIONS = ['📁', '🚀', '🎨', '📊', '💼', '🔧', '📸', '🎬', '📚', '🏗️'];

type RenameValues = z.infer<typeof renameSchema>;

export function ProjectSettingsTab() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: project } = useProject(projectId);
  const { data: workspaces } = useWorkspaces({ status: 'active' });
  const { canEditSettings } = useProjectPermissions(projectId);

  const renameProject = useRenameProject();
  const updateDetails = useUpdateProjectDetails();
  const moveProject = useMoveProject();
  const archiveProject = useArchiveProject();
  const restoreProject = useRestoreProject();
  const deleteProject = useDeleteProject();

  const [description, setDescription] = useState(project?.description ?? '');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RenameValues>({
    resolver: zodResolver(renameSchema),
    values: { name: project?.name ?? '' },
  });

  if (!project || !projectId) return null;

  const isArchived = project.status === 'archived';

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader><h2 className="text-sm font-semibold text-gray-900">General</h2></CardHeader>
        <CardBody className="space-y-4">
          <form onSubmit={handleSubmit((v) => renameProject.mutate({ id: projectId, name: v.name }))} className="flex items-end gap-2">
            <Input label="Project name" disabled={!canEditSettings} error={errors.name?.message} {...register('name')} className="flex-1" />
            {canEditSettings && <Button type="submit" isLoading={renameProject.isPending}>Save</Button>}
          </form>

          <div className="flex items-end gap-2">
            <Textarea
              label="Description"
              rows={3}
              disabled={!canEditSettings}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-1"
            />
          </div>
          {canEditSettings && (
            <Button variant="outline" size="sm" onClick={() => updateDetails.mutate({ id: projectId, updates: { description } })} isLoading={updateDetails.isPending}>
              Save description
            </Button>
          )}

          {canEditSettings && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Project icon</p>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => updateDetails.mutate({ id: projectId, updates: { icon } })}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border text-lg transition-colors ${project.icon === icon ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {canEditSettings && (
        <Card>
          <CardHeader><h2 className="text-sm font-semibold text-gray-900">Move project</h2></CardHeader>
          <CardBody>
            <Select
              label="Workspace"
              defaultValue={project.workspace_id}
              onChange={(e) => moveProject.mutate({ id: projectId, workspaceId: e.target.value })}
            >
              {workspaces?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </Select>
          </CardBody>
        </Card>
      )}

      {canEditSettings && (
        <Card className="border-red-200">
          <CardHeader className="border-red-100">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-red-700">
              <AlertTriangle className="h-4 w-4" /> Danger zone
            </h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">{isArchived ? 'Restore project' : 'Archive project'}</p>
                <p className="text-xs text-gray-500">{isArchived ? 'Make this project active again.' : 'Hide this project without deleting its data.'}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => (isArchived ? restoreProject.mutate(projectId) : archiveProject.mutate(projectId))}
              >
                {isArchived ? 'Restore' : 'Archive'}
              </Button>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <div>
                <p className="text-sm font-medium text-gray-800">Delete project</p>
                <p className="text-xs text-gray-500">Permanently delete this project and all its files.</p>
              </div>
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>Delete</Button>
            </div>
          </CardBody>
        </Card>
      )}

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => { deleteProject.mutate(projectId); navigate('/workspaces'); }}
        title="Delete project"
        description={`This will permanently delete "${project.name}" and all of its files. This action cannot be undone.`}
        confirmLabel="Delete permanently"
        isDanger
        isLoading={deleteProject.isPending}
      />
    </div>
  );
}

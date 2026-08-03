import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Modal, Input, Textarea, Select, Button } from '@/components/ui';
import { projectSchema } from '@/utils/validation';
import { useCreateProject } from '@/hooks/useProjects';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import type { z } from 'zod';

type FormValues = z.infer<typeof projectSchema>;

export function CreateProjectModal({ isOpen, onClose, defaultWorkspaceId }: { isOpen: boolean; onClose: () => void; defaultWorkspaceId?: string }) {
  const { data: workspaces } = useWorkspaces({ status: 'active' });
  const createProject = useCreateProject();
  const navigate = useNavigate();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { workspaceId: defaultWorkspaceId },
  });

  const onSubmit = async (values: FormValues) => {
    const project = await createProject.mutateAsync({ workspaceId: values.workspaceId, name: values.name, description: values.description });
    reset();
    onClose();
    navigate(`/projects/${project.id}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create project" description="Projects hold your files, links, and collaborators.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select label="Workspace" error={errors.workspaceId?.message} {...register('workspaceId')}>
          <option value="">Select a workspace</option>
          {workspaces?.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </Select>
        <Input label="Project name" placeholder="Q3 Marketing Assets" error={errors.name?.message} {...register('name')} />
        <Textarea label="Description (optional)" placeholder="What's this project about?" rows={3} error={errors.description?.message} {...register('description')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={createProject.isPending}>Create project</Button>
        </div>
      </form>
    </Modal>
  );
}

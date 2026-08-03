import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Input, Textarea, Button } from '@/components/ui';
import { workspaceSchema } from '@/utils/validation';
import { useCreateWorkspace } from '@/hooks/useWorkspaces';
import { useNavigate } from 'react-router-dom';
import type { z } from 'zod';

type FormValues = z.infer<typeof workspaceSchema>;

export function CreateWorkspaceModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(workspaceSchema) });
  const createWorkspace = useCreateWorkspace();
  const navigate = useNavigate();

  const onSubmit = async (values: FormValues) => {
    const workspace = await createWorkspace.mutateAsync(values);
    reset();
    onClose();
    navigate(`/workspaces/${workspace.id}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create workspace" description="Group related projects together under one workspace.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Workspace name" placeholder="Marketing Team" error={errors.name?.message} {...register('name')} />
        <Textarea label="Description (optional)" placeholder="What's this workspace for?" rows={3} error={errors.description?.message} {...register('description')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={createWorkspace.isPending}>Create workspace</Button>
        </div>
      </form>
    </Modal>
  );
}

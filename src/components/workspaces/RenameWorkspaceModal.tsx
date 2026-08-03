import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Input, Button } from '@/components/ui';
import { renameSchema } from '@/utils/validation';
import { useRenameWorkspace } from '@/hooks/useWorkspaces';
import type { Workspace } from '@/types/database';
import type { z } from 'zod';

type FormValues = z.infer<typeof renameSchema>;

export function RenameWorkspaceModal({ isOpen, onClose, workspace }: { isOpen: boolean; onClose: () => void; workspace: Workspace }) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(renameSchema), defaultValues: { name: workspace.name } });
  const renameWorkspace = useRenameWorkspace();

  const onSubmit = async (values: FormValues) => {
    await renameWorkspace.mutateAsync({ id: workspace.id, name: values.name });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rename workspace">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Workspace name" error={errors.name?.message} {...register('name')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={renameWorkspace.isPending}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}

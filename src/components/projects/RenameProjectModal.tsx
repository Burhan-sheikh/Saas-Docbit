import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Input, Button } from '@/components/ui';
import { renameSchema } from '@/utils/validation';
import { useRenameProject } from '@/hooks/useProjects';
import type { Project } from '@/types/database';
import type { z } from 'zod';

type FormValues = z.infer<typeof renameSchema>;

export function RenameProjectModal({ isOpen, onClose, project }: { isOpen: boolean; onClose: () => void; project: Project }) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(renameSchema), defaultValues: { name: project.name } });
  const renameProject = useRenameProject();

  const onSubmit = async (values: FormValues) => {
    await renameProject.mutateAsync({ id: project.id, name: values.name });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rename project">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Project name" error={errors.name?.message} {...register('name')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={renameProject.isPending}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}

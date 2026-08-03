import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Input, Button } from '@/components/ui';
import { createFolderSchema } from '@/utils/validation';
import { useCreateFolder } from '@/hooks/useFiles';
import type { z } from 'zod';

type FormValues = z.infer<typeof createFolderSchema>;

export function CreateFolderModal({ isOpen, onClose, projectId, parentId }: { isOpen: boolean; onClose: () => void; projectId: string; parentId: string | null }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(createFolderSchema) });
  const createFolder = useCreateFolder(projectId);

  const onSubmit = async (values: FormValues) => {
    await createFolder.mutateAsync({ parentId, name: values.name });
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create folder">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Folder name" placeholder="New folder" error={errors.name?.message} {...register('name')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={createFolder.isPending}>Create</Button>
        </div>
      </form>
    </Modal>
  );
}

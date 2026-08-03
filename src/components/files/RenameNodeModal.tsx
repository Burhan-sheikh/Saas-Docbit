import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Input, Button } from '@/components/ui';
import { renameSchema } from '@/utils/validation';
import { useRenameNode } from '@/hooks/useFiles';
import type { FileNode } from '@/types/database';
import type { z } from 'zod';

type FormValues = z.infer<typeof renameSchema>;

export function RenameNodeModal({ isOpen, onClose, projectId, node }: { isOpen: boolean; onClose: () => void; projectId: string; node: FileNode }) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(renameSchema), defaultValues: { name: node.name } });
  const renameNode = useRenameNode(projectId);

  const onSubmit = async (values: FormValues) => {
    await renameNode.mutateAsync({ id: node.id, name: values.name });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Rename ${node.type}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Name" error={errors.name?.message} {...register('name')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={renameNode.isPending}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}

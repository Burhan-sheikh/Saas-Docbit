import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Textarea, Select, Button } from '@/components/ui';
import { inviteMembersSchema } from '@/utils/validation';
import { useInviteMembers } from '@/hooks/useMembers';
import type { z } from 'zod';

type FormValues = z.infer<typeof inviteMembersSchema>;

export function InviteMembersModal({ isOpen, onClose, projectId }: { isOpen: boolean; onClose: () => void; projectId: string }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(inviteMembersSchema),
    defaultValues: { role: 'viewer' },
  });
  const inviteMembers = useInviteMembers(projectId);

  const onSubmit = async (values: FormValues) => {
    const emails = values.emails.split(/[\s,;]+/).filter(Boolean);
    await inviteMembers.mutateAsync({ emails, role: values.role });
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite members" description="Paste multiple email addresses separated by commas or new lines.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Textarea label="Email addresses" placeholder="jane@company.com, sam@company.com" rows={4} error={errors.emails?.message} {...register('emails')} />
        <Select label="Role" error={errors.role?.message} {...register('role')}>
          <option value="viewer">Viewer — can view and download</option>
          <option value="editor">Editor — can upload, edit, and share</option>
        </Select>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={inviteMembers.isPending}>Send invites</Button>
        </div>
      </form>
    </Modal>
  );
}

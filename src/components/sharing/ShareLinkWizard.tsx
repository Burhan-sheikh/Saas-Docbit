import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Input, Select, Switch, Button, Checkbox } from '@/components/ui';
import { shareLinkSchema } from '@/utils/validation';
import { useCreateLink } from '@/hooks/useLinks';
import { useFileNodes } from '@/hooks/useFiles';
import { CATEGORY_LABELS } from '@/utils/fileCategory';
import { useAuth } from '@/context/AuthContext';
import type { LinkTargetType } from '@/types/database';
import type { z } from 'zod';

type FormValues = z.infer<typeof shareLinkSchema>;

export function ShareLinkWizard({ isOpen, onClose, projectId }: { isOpen: boolean; onClose: () => void; projectId: string }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [targetType, setTargetType] = useState<LinkTargetType>('project');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { data: rootNodes } = useFileNodes(projectId, null);
  const createLink = useCreateLink(projectId);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(shareLinkSchema),
    defaultValues: { requireLogin: false, permission: 'download' },
  });

  const close = () => {
    setStep(1);
    setTargetType('project');
    setSelectedIds(new Set());
    reset();
    onClose();
  };

  const onSubmit = async (values: FormValues) => {
    await createLink.mutateAsync({
      targetType,
      targetIds: targetType === 'project' ? [] : Array.from(selectedIds),
      customSlug: values.customSlug,
      password: values.password,
      expiresInDays: values.expiresInDays,
      maxDownloads: values.maxDownloads,
      requireLogin: values.requireLogin,
      permission: values.permission,
      createdBy: user!.id,
    });
    close();
  };

  const toggleNode = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="Create share link" description={`Step ${step} of 2`} size="lg">
      {step === 1 ? (
        <div className="space-y-4">
          <Select label="What do you want to share?" value={targetType} onChange={(e) => { setTargetType(e.target.value as LinkTargetType); setSelectedIds(new Set()); }}>
            <option value="project">Entire project</option>
            <option value="category">Entire format folder</option>
            <option value="folder">Specific folder</option>
            <option value="file">Specific file(s)</option>
          </Select>

          {targetType !== 'project' && (
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
              {(rootNodes ?? [])
                .filter((n) => (targetType === 'category' ? n.is_system_folder : targetType === 'folder' ? n.type === 'folder' : n.type === 'file'))
                .map((n) => (
                  <label key={n.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50">
                    <Checkbox checked={selectedIds.has(n.id)} onChange={() => toggleNode(n.id)} />
                    <span className="text-sm text-gray-700">{n.is_system_folder ? CATEGORY_LABELS[n.category!] : n.name}</span>
                  </label>
                ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={() => setStep(2)} disabled={targetType !== 'project' && selectedIds.size === 0}>
              Continue
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Custom URL (optional)" placeholder="my-custom-link" hint="Leave blank to auto-generate a random link" error={errors.customSlug?.message} {...register('customSlug')} />
          <Input label="Password (optional)" type="password" placeholder="Protect this link with a password" error={errors.password?.message} {...register('password')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Expires in (days)" type="number" min={0} placeholder="Never" {...register('expiresInDays', { valueAsNumber: true })} />
            <Input label="Max downloads" type="number" min={0} placeholder="Unlimited" {...register('maxDownloads', { valueAsNumber: true })} />
          </div>
          <Select label="Permission" {...register('permission')}>
            <option value="download">Allow download</option>
            <option value="view">View only</option>
          </Select>
          <Controller
            control={control}
            name="requireLogin"
            render={({ field }) => <Switch checked={field.value} onChange={field.onChange} label="Require login to access this link" />}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button type="submit" isLoading={createLink.isPending}>Generate link</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

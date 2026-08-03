import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useProject } from '@/hooks/useProjects';
import { useCreatePermissionRequest } from '@/hooks/useMembers';
import { Button, Textarea, Card, CardBody } from '@/components/ui';

export function AccessDeniedPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId);
  const createRequest = useCreatePermissionRequest(projectId!);
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    await createRequest.mutateAsync(reason || undefined);
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardBody className="flex flex-col items-center p-8 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
            <ShieldOff className="h-7 w-7" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">You don't have access to this project</h1>
          {project && (
            <div className="mt-3 rounded-lg bg-gray-50 px-4 py-3 text-left text-sm">
              <p className="font-medium text-gray-800">{project.name}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                This project is private. You'll need permission from the project owner to view its contents.
              </p>
            </div>
          )}

          {submitted ? (
            <div className="mt-6 w-full rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Your request has been sent to the project owner. You'll be notified once it's reviewed.
            </div>
          ) : (
            <div className="mt-6 w-full space-y-3 text-left">
              <Textarea
                label="Reason for access (optional)"
                placeholder="Let the owner know why you need access…"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <Button fullWidth onClick={handleSubmit} isLoading={createRequest.isPending}>
                Request access
              </Button>
            </div>
          )}

          <Button variant="ghost" className="mt-3" onClick={() => navigate('/overview')}>
            Back to dashboard
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

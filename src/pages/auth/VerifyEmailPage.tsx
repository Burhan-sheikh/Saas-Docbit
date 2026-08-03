import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui';
import { authApi } from '@/lib/api/auth';
import { useAuth } from '@/context/AuthContext';

export function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const email = (location.state as { email?: string } | null)?.email || user?.email || '';
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    try {
      await authApi.resendVerificationEmail(email);
      toast.success('Verification email sent');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not resend email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout title="Verify your email">
      <div className="flex flex-col items-center text-center">
        <MailCheck className="mb-3 h-10 w-10 text-brand-500" />
        <p className="text-sm text-gray-600">
          We sent a verification link to <span className="font-medium text-gray-900">{email || 'your email address'}</span>. Click the link to activate your account.
        </p>
        <div className="mt-6 flex w-full flex-col gap-2">
          <Button variant="outline" fullWidth onClick={handleResend} isLoading={isResending}>
            Resend verification email
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={async () => {
              await signOut();
              navigate('/login');
            }}
          >
            Back to sign in
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}

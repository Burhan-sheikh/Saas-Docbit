import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input, Button } from '@/components/ui';
import { resetPasswordSchema } from '@/utils/validation';
import { authApi } from '@/lib/api/auth';
import type { z } from 'zod';

type FormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await authApi.updatePassword(values.password);
      toast.success('Password updated. Please sign in again.');
      navigate('/login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password for your account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="New password" type="password" placeholder="At least 8 characters" leftIcon={<Lock className="h-4 w-4" />} error={errors.password?.message} {...register('password')} />
        <Input label="Confirm new password" type="password" placeholder="Re-enter your password" leftIcon={<Lock className="h-4 w-4" />} error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}

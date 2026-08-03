import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input, Button } from '@/components/ui';
import { forgotPasswordSchema } from '@/utils/validation';
import { authApi } from '@/lib/api/auth';
import type { z } from 'zod';

type FormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await authApi.requestPasswordReset(values.email);
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout title="Check your email">
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500" />
          <p className="text-sm text-gray-600">
            We sent a password reset link to <span className="font-medium text-gray-900">{getValues('email')}</span>.
          </p>
          <Link to="/login" className="mt-6 text-sm font-medium text-brand-600 hover:text-brand-700">
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email and we'll send you a reset link">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Email" type="email" placeholder="you@company.com" leftIcon={<Mail className="h-4 w-4" />} error={errors.email?.message} {...register('email')} />
        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Send reset link
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

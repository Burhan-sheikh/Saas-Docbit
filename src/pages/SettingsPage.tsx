import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api/auth';
import { uploadFileToB2 } from '@/lib/integrations/storage';
import { Input, Button, Avatar, Card, CardHeader, CardBody, Badge } from '@/components/ui';
import { resetPasswordSchema } from '@/utils/validation';

const profileSchema = z.object({ fullName: z.string().trim().min(2, 'Enter your full name') });
type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof resetPasswordSchema>;

export function SettingsPage() {
  const { profile, user, isEmailVerified, refreshProfile } = useAuth();
  const [avatarUploading, setAvatarUploading] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), values: { fullName: profile?.full_name ?? '' } });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordValues>({ resolver: zodResolver(resetPasswordSchema) });

  const onProfileSubmit = async (values: ProfileValues) => {
    if (!user) return;
    await authApi.updateProfile(user.id, { full_name: values.fullName });
    await refreshProfile();
    toast.success('Profile updated');
  };

  const onPasswordSubmit = async (values: PasswordValues) => {
    await authApi.updatePassword(values.password);
    resetPasswordForm();
    toast.success('Password updated');
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarUploading(true);
    try {
      const { publicUrl } = await uploadFileToB2(`avatars/${user.id}`, file);
      await authApi.updateProfile(user.id, { avatar_url: publicUrl });
      await refreshProfile();
      toast.success('Avatar updated');
    } catch {
      toast.error('Could not upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your profile and account security.</p>
      </div>

      <Card>
        <CardHeader><h2 className="text-sm font-semibold text-gray-900">Profile</h2></CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar name={profile?.full_name} email={profile?.email} src={profile?.avatar_url} size="lg" />
            <div>
              <label className="cursor-pointer text-sm font-medium text-brand-600 hover:text-brand-700">
                {avatarUploading ? 'Uploading…' : 'Change avatar'}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
              </label>
              <p className="text-xs text-gray-400">JPG, PNG or GIF. Max 5MB.</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            <Input label="Full name" error={profileErrors.fullName?.message} {...registerProfile('fullName')} />
            <Input label="Email" value={profile?.email ?? ''} disabled />
            <div className="flex items-center gap-2 text-xs">
              {isEmailVerified ? (
                <Badge variant="green"><CheckCircle2 className="h-3 w-3" /> Verified</Badge>
              ) : (
                <Badge variant="yellow"><AlertCircle className="h-3 w-3" /> Not verified</Badge>
              )}
            </div>
            <Button type="submit">Save changes</Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="text-sm font-semibold text-gray-900">Password</h2></CardHeader>
        <CardBody>
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
            <Input label="New password" type="password" error={passwordErrors.password?.message} {...registerPassword('password')} />
            <Input label="Confirm new password" type="password" error={passwordErrors.confirmPassword?.message} {...registerPassword('confirmPassword')} />
            <Button type="submit" variant="outline">Update password</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

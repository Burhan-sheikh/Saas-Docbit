import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FullPageSpinner } from '@/components/ui';

/** Blocks access until the user's email is verified (Google sign-ins are pre-verified). */
export function VerifiedRoute() {
  const { isEmailVerified, isLoading } = useAuth();

  if (isLoading) return <FullPageSpinner />;
  if (!isEmailVerified) return <Navigate to="/verify-email" replace />;

  return <Outlet />;
}

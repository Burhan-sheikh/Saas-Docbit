import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { FullPageSpinner } from '@/components/ui';

/** Handles the redirect from Google OAuth (and email confirmation links), then routes to the app. */
export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handle = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/overview', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    };
    handle();
  }, [navigate]);

  return <FullPageSpinner />;
}

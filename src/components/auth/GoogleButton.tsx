import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui';
import { authApi } from '@/lib/api/auth';

export function GoogleButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await authApi.signInWithGoogle();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start Google sign-in');
      setIsLoading(false);
    }
  };

  return (
    <Button type="button" variant="outline" fullWidth onClick={handleClick} isLoading={isLoading}>
      <svg className="h-4 w-4" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.87c2.27-2.09 3.59-5.17 3.59-8.81Z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.28v3.1A12 12 0 0 0 12 24Z" />
        <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.38l3.99-3.1Z" />
        <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l3.99 3.1C6.22 6.88 8.87 4.77 12 4.77Z" />
      </svg>
      Continue with Google
    </Button>
  );
}

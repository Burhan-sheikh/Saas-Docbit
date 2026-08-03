import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <Compass className="mb-4 h-10 w-10 text-brand-500" />
      <h1 className="text-3xl font-semibold text-gray-900">404</h1>
      <p className="mt-2 text-sm text-gray-500">The page you're looking for doesn't exist.</p>
      <Link to="/overview">
        <Button className="mt-6">Back to dashboard</Button>
      </Link>
    </div>
  );
}

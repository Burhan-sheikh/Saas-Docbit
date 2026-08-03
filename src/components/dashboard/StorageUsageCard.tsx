import { HardDrive } from 'lucide-react';
import { ProgressBar, Skeleton } from '@/components/ui';
import { formatBytes } from '@/utils/format';

export function StorageUsageCard({ usedBytes, maxBytes, isLoading }: { usedBytes: number; maxBytes: number; isLoading?: boolean }) {
  const percent = maxBytes > 0 ? (usedBytes / maxBytes) * 100 : 0;
  const variant = percent > 90 ? 'red' : percent > 70 ? 'yellow' : 'brand';

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <HardDrive className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-gray-900">Storage usage</span>
        </div>
        {!isLoading && <span className="text-xs text-gray-500">{percent.toFixed(0)}%</span>}
      </div>
      {isLoading ? (
        <Skeleton className="h-2 w-full rounded-full" />
      ) : (
        <>
          <ProgressBar value={usedBytes} max={maxBytes} variant={variant} />
          <p className="mt-2 text-xs text-gray-500">
            {formatBytes(usedBytes)} of {formatBytes(maxBytes)} used
          </p>
        </>
      )}
    </div>
  );
}

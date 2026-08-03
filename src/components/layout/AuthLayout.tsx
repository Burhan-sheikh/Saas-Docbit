import type { ReactNode } from 'react';

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="safe-top safe-bottom flex min-h-full w-full items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">S</div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className="card p-6 sm:p-7">{children}</div>
      </div>
    </div>
  );
}

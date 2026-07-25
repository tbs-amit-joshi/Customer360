import React from 'react';

interface CustomerDataLoaderProps {
  overlay?: boolean;
}

export default function CustomerDataLoader({
  overlay = true
}: CustomerDataLoaderProps) {
  const wrapperClass = overlay
    ? 'fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/5 px-4 pointer-events-auto'
    : 'w-full flex items-center justify-center px-4 py-4';

  return (
    <div className={wrapperClass} aria-live="polite" aria-busy="true">
      <div
        className={`flex min-w-[130px] flex-col gap-2 rounded-xl border px-4 py-3 ${
          overlay
            ? 'border-white/85 bg-white/95 shadow-[0_12px_28px_rgba(15,23,42,0.10)]'
            : 'border-border-subtle bg-bg-card shadow-xxs'
        }`}
      >
        <p className="text-sm font-semibold tracking-tight text-text-primary">
          Loading...
        </p>
        <div
          className="relative h-1 w-full overflow-hidden rounded-full bg-brand-primary/10"
          aria-hidden="true"
        >
          <span className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-gradient-to-r from-brand-primary/20 via-brand-primary/80 to-brand-primary/20 animate-loading-bar" />
        </div>
      </div>
    </div>
  );
}

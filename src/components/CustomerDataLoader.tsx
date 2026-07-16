import React from 'react';
import { RefreshCw } from 'lucide-react';

interface CustomerDataLoaderProps {
  overlay?: boolean;
}

export default function CustomerDataLoader({
  overlay = true
}: CustomerDataLoaderProps) {
  const wrapperClass = overlay
    ? 'fixed inset-0 z-[60] flex items-center justify-center bg-slate-50/80 px-4 pointer-events-auto'
    : 'w-full flex items-center justify-center px-4 py-10';

  return (
    <div className={wrapperClass} aria-live="polite" aria-busy="true">
      <RefreshCw className="h-10 w-10 animate-spin text-[#2563eb] drop-shadow-[0_1px_2px_rgba(37,99,235,0.18)]" />
    </div>
  );
}

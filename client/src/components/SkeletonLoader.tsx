import type { ReactNode } from "react";

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-slate-200 ${className}`}
    />
  );
}

export function SkeletonLoader({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" className="min-w-0">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

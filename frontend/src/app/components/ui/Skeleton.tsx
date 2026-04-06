interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton rounded-xl ${className}`}
    />
  );
}

export function PropertyCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm"
    >
      <Skeleton className="h-56 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-3 pt-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-7 w-36 mt-1" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

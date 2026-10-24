import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/layout/app-shell";

export function DetailSkeleton() {
  return (
    <PageContainer>
      <div
        aria-busy="true"
        aria-label="Inhalt wird geladen"
        className="space-y-8"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
          <Skeleton className="aspect-[3/4] w-36 rounded-lg sm:w-48" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-3/4 max-w-md" />
            <Skeleton className="h-4 w-1/2 max-w-xs" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-11 w-36 rounded-xl" />
              <Skeleton className="h-11 w-28 rounded-xl" />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-10 w-72 rounded-full" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      </div>
    </PageContainer>
  );
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Beiträge werden geladen"
      className="space-y-4"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-3 rounded-lg border bg-card p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          {i === 0 && <Skeleton className="aspect-[16/9] w-full rounded-md" />}
        </div>
      ))}
    </div>
  );
}

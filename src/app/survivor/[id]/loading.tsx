import { Page } from "@/components/ui/Page";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <Page>
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-2 h-9 w-64" />
      <Skeleton className="mt-2 h-4 w-48" />
      <Skeleton className="mt-4 h-12 w-full rounded-lg" />
      <Skeleton className="mt-6 h-6 w-32" />
      <div className="mt-2 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="mt-8 h-6 w-32" />
      <div className="mt-2 divide-y divide-cardborder overflow-hidden rounded-xl border border-cardborder bg-card">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </Page>
  );
}

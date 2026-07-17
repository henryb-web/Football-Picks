import { Page } from "@/components/ui/Page";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <Page>
      <Skeleton className="h-10 w-40" />
      <div className="mt-5 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-16 rounded-full" />
        ))}
      </div>
      <Skeleton className="mt-4 h-11 w-full rounded-lg" />
      <div className="mt-6 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-cardborder bg-card p-4 pl-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-5 w-44" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="mt-3 h-3 w-56" />
            <Skeleton className="mt-3 h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </Page>
  );
}

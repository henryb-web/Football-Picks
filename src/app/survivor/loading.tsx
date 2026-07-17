import { Page } from "@/components/ui/Page";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <Page>
      <Skeleton className="h-10 w-48" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
      <Skeleton className="mt-8 h-6 w-36" />
      <div className="mt-2 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-cardborder bg-card p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-8" />
          </div>
        ))}
      </div>
    </Page>
  );
}

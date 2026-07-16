import { Page } from "@/components/ui/Page";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <Page>
      <Skeleton className="h-12 w-72" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[92px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-4 h-20 w-full rounded-xl" />
      <Skeleton className="mt-8 h-6 w-40" />
      <Skeleton className="mt-2 h-44 w-full rounded-lg" />
      <Skeleton className="mt-8 h-6 w-36" />
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </Page>
  );
}

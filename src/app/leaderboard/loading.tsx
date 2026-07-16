import { Page } from "@/components/ui/Page";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <Page>
      <Skeleton className="h-10 w-52" />
      <div className="mt-6 divide-y divide-cardborder overflow-hidden rounded-xl border border-cardborder bg-card">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    </Page>
  );
}

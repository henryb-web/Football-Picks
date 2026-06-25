import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

// Shared content container so every page has the same width + padding.
export function Page({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-3xl px-6 py-10">{children}</main>;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="flex items-stretch gap-3">
        <span
          aria-hidden
          className="mt-1 w-1.5 shrink-0 -skew-x-12 rounded-sm bg-emerald-500"
        />
        <div>
          <h1 className="headline text-4xl text-foreground sm:text-5xl">{title}</h1>
          {subtitle ? <p className="mt-1.5 text-sm text-muted">{subtitle}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-cardborder bg-card p-10 text-center">
      <Icon className="h-8 w-8 text-muted" />
      <div className="max-w-sm text-sm text-muted">{children}</div>
    </div>
  );
}

// A shimmering placeholder block. Size/shape it with className.
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-md bg-cardborder/70 ${className}`}
    />
  );
}

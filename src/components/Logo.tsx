export function Logo({ withText = true }: { withText?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-600 text-sm font-black text-white">
        6
      </span>
      {withText ? (
        <span className="headline text-xl">
          Pick<span className="text-accent-500">Six</span>
        </span>
      ) : null}
    </span>
  );
}

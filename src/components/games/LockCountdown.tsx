"use client";

import { useEffect, useState } from "react";

// Live "locks in 3h 12m" countdown. Renders nothing on the server / before
// mount to avoid a hydration mismatch (the value depends on the client clock).
export function LockCountdown({ lockAt }: { lockAt: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (now === null) return null;
  const ms = new Date(lockAt).getTime() - now;
  if (ms <= 0) return null;

  const totalMin = Math.floor(ms / 60_000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  const label =
    days > 0
      ? `locks in ${days}d ${hours}h`
      : hours > 0
        ? `locks in ${hours}h ${mins}m`
        : `locks in ${mins}m`;

  return <span className="font-medium text-emerald-500">{label}</span>;
}

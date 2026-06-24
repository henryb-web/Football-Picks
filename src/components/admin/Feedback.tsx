import type { AdminState } from "@/lib/admin-types";

export function Feedback({ state }: { state: AdminState }) {
  if (!state) return null;
  if (state.error) {
    return <p className="text-sm font-medium text-red-600">{state.error}</p>;
  }
  if (state.ok) {
    return <p className="text-sm font-medium text-emerald-600">{state.ok}</p>;
  }
  return null;
}

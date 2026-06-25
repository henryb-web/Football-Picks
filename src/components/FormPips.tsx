import type { FormResult } from "@/lib/scoring";

// Last-5 form as colored dots (oldest -> newest).
export function FormPips({ form }: { form: FormResult[] }) {
  if (form.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5" title="Last 5">
      {form.map((r, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${
            r === "W" ? "bg-cyan-500" : r === "L" ? "bg-red-500" : "bg-muted"
          }`}
        />
      ))}
    </span>
  );
}

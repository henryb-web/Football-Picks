import type { Confidence, PickResult } from "@/generated/prisma/client";

// Presentation + point values for each confidence tier. Untagged picks aren't in
// here — they score the normal way (correct +1 / wrong 0) via confidencePoints().
export const CONFIDENCE_META: Record<
  Confidence,
  { emoji: string; label: string; win: number; loss: number }
> = {
  STRONG: { emoji: "💪", label: "Strong", win: 2, loss: -1 },
  LOCK: { emoji: "🔒", label: "Lock", win: 3, loss: -2 },
};

// Points a settled pick earns given its confidence tag (null = untagged).
// Single source of truth shared by the scoring engine and the UI previews.
export function confidencePoints(
  result: PickResult,
  confidence: Confidence | null,
): number {
  if (result === "WIN") return confidence ? CONFIDENCE_META[confidence].win : 1;
  if (result === "LOSS") return confidence ? CONFIDENCE_META[confidence].loss : 0;
  return 0; // PUSH / PENDING / VOID
}

// "+2 / −1" style summary for a tier, for UI hints.
export function confidenceHint(confidence: Confidence): string {
  const m = CONFIDENCE_META[confidence];
  return `+${m.win} / ${m.loss}`;
}

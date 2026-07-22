"use client";

import { useState } from "react";
import { GameCard, type GameCardData } from "./GameCard";
import { GameModal } from "./GameModal";
import type { Confidence, PickSide } from "@/generated/prisma/client";

// One row in the games list — everything the card and its modal need.
export type GameEntry = {
  game: GameCardData;
  pick: PickSide | null;
  confidence: Confidence | null;
  consensus: { home: number; away: number };
  locked: boolean;
};

// Renders the list of game cards and a single, always-mounted modal. Opening a
// card records its index; the modal shows that game and lets the user step to
// the adjacent games (arrows / ← → keys) without ever closing — the modal body
// just cross-fades to the next game.
export function GamesBrowser({
  entries,
  loggedIn,
  tz = "America/Chicago",
}: {
  entries: GameEntry[];
  loggedIn: boolean;
  tz?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const current = openIndex != null ? entries[openIndex] : null;

  return (
    <div className="space-y-2">
      {entries.map((e, i) => (
        <GameCard
          key={e.game.id}
          game={e.game}
          pick={e.pick}
          confidence={e.confidence}
          consensus={e.consensus}
          loggedIn={loggedIn}
          locked={e.locked}
          tz={tz}
          onOpen={() => setOpenIndex(i)}
        />
      ))}
      {current && openIndex != null ? (
        <GameModal
          game={current.game}
          pick={current.pick}
          confidence={current.confidence}
          consensus={current.consensus}
          locked={current.locked}
          loggedIn={loggedIn}
          tz={tz}
          hasPrev={openIndex > 0}
          hasNext={openIndex < entries.length - 1}
          onPrev={() =>
            setOpenIndex((i) => (i != null && i > 0 ? i - 1 : i))
          }
          onNext={() =>
            setOpenIndex((i) =>
              i != null && i < entries.length - 1 ? i + 1 : i,
            )
          }
          onClose={() => setOpenIndex(null)}
        />
      ) : null}
    </div>
  );
}

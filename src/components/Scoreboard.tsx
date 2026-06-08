"use client";

import { formatTime } from "@/lib/format";
import type { HighScore } from "@/types/game";

type Props = {
  score: number;
  elapsedMs: number;
  highScore: HighScore;
  compact?: boolean;
};

export function Scoreboard({ score, elapsedMs, highScore, compact = false }: Props) {
  return (
    <section className={`grid grid-cols-3 ${compact ? "active-mobile-gap-tight gap-1.5" : "gap-2"}`}>
      <div className={`rounded-lg border border-white/10 bg-white/8 ${compact ? "active-mobile-score-card p-2" : "p-3"}`}>
        <p className="text-[10px] uppercase tracking-wide text-slate-300 sm:text-xs">Golpes</p>
        <p className={`${compact ? "active-mobile-score-value text-xl" : "text-2xl"} font-bold text-white`}>{score}</p>
      </div>
      <div className={`rounded-lg border border-white/10 bg-white/8 ${compact ? "active-mobile-score-card p-2" : "p-3"}`}>
        <p className="text-[10px] uppercase tracking-wide text-slate-300 sm:text-xs">Tiempo</p>
        <p className={`${compact ? "active-mobile-score-value text-xl" : "text-2xl"} font-bold text-white`}>{formatTime(elapsedMs)}</p>
      </div>
      <div className={`rounded-lg border border-white/10 bg-white/8 ${compact ? "active-mobile-score-card p-2" : "p-3"}`}>
        <p className="text-[10px] uppercase tracking-wide text-slate-300 sm:text-xs">Record</p>
        <p className={`${compact ? "active-mobile-score-value text-xl" : "text-2xl"} font-bold text-white`}>{highScore.score}</p>
      </div>
    </section>
  );
}

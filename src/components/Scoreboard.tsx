"use client";

import { formatTime } from "@/lib/format";
import type { HighScore } from "@/types/game";

type Props = {
  score: number;
  elapsedMs: number;
  highScore: HighScore;
};

export function Scoreboard({ score, elapsedMs, highScore }: Props) {
  return (
    <section className="grid grid-cols-3 gap-2">
      <div className="rounded-lg border border-white/10 bg-white/8 p-3">
        <p className="text-xs uppercase tracking-wide text-slate-300">Golpes</p>
        <p className="text-2xl font-bold text-white">{score}</p>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/8 p-3">
        <p className="text-xs uppercase tracking-wide text-slate-300">Tiempo</p>
        <p className="text-2xl font-bold text-white">{formatTime(elapsedMs)}</p>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/8 p-3">
        <p className="text-xs uppercase tracking-wide text-slate-300">Record</p>
        <p className="text-2xl font-bold text-white">{highScore.score}</p>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { AnswerInput } from "@/components/AnswerInput";
import { GameCanvas } from "@/components/GameCanvas";
import { OperationGrid } from "@/components/OperationGrid";
import { Scoreboard } from "@/components/Scoreboard";
import { SettingsPanel } from "@/components/SettingsPanel";
import { formatTime } from "@/lib/format";
import { createOperationSet, createUniqueOperation } from "@/lib/operations";
import {
  defaultHighScore,
  defaultSettings,
  loadHighScore,
  loadSettings,
  normalizeSettings,
  saveHighScore,
  saveSettings
} from "@/lib/storage";
import { useGameLoop } from "@/hooks/useGameLoop";
import { useWakeLock } from "@/hooks/useWakeLock";
import type { GameSettings, HighScore, Operation } from "@/types/game";

export function GameShell() {
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [answer, setAnswer] = useState("");
  const [highScore, setHighScore] = useState<HighScore>(defaultHighScore);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const { world, start, restart, setStatus, executeMovement, resetForSettings } = useGameLoop(settings);

  const running = world.status === "running";
  const answerInputActive = running && operations.length > 0;
  const statusText = useMemo(() => {
    if (world.status === "running") return "Jugando";
    if (world.status === "paused") return "Pausado";
    if (world.status === "gameOver") return "Fin del juego";
    return "Listo";
  }, [world.status]);

  useWakeLock(running);

  useEffect(() => {
    const savedSettings = loadSettings();
    setSettings(savedSettings);
    setOperations(createOperationSet(savedSettings));
    setHighScore(loadHighScore());
    resetForSettings(savedSettings);
    setHasLoadedStorage(true);
  }, [resetForSettings]);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    saveSettings(settings);
  }, [hasLoadedStorage, settings]);

  useEffect(() => {
    if (world.status !== "gameOver") return;

    const betterScore =
      world.score > highScore.score ||
      (world.score === highScore.score && world.elapsedMs > highScore.survivalMs);

    if (betterScore) {
      const nextHighScore = { score: world.score, survivalMs: world.elapsedMs };
      setHighScore(nextHighScore);
      saveHighScore(nextHighScore);
    }
  }, [highScore, world.elapsedMs, world.score, world.status]);

  function updateSettings(nextSettings: GameSettings) {
    const normalizedSettings = normalizeSettings(nextSettings);
    setSettings(normalizedSettings);
    setOperations(createOperationSet(normalizedSettings));
    resetForSettings(normalizedSettings);
  }

  function prepareSettingsForGame() {
    const normalizedSettings = normalizeSettings(settings);
    if (normalizedSettings !== settings) {
      setSettings(normalizedSettings);
      setOperations(createOperationSet(normalizedSettings));
    }

    return normalizedSettings;
  }

  function handleAnswer(nextValue: string) {
    setAnswer(nextValue);
    if (!nextValue || world.status !== "running") return;

    const numericAnswer = Number(nextValue);
    const match = operations.find((operation) => operation.answer === numericAnswer);
    if (!match) return;

    executeMovement(match.action);
    setAnswer("");
    setOperations((current) =>
      current.map((operation) => {
        if (operation.id !== match.id) return operation;

        const existingAnswers = new Set(
          current
            .filter((currentOperation) => currentOperation.id !== match.id)
            .map((currentOperation) => currentOperation.answer)
        );

        return createUniqueOperation(match.kind, settings, existingAnswers);
      })
    );
  }

  function handlePrimaryAction() {
    const playableSettings = prepareSettingsForGame();

    if (world.status === "ready") {
      if (operations.length === 0) {
        setOperations(createOperationSet(playableSettings));
      }
      start();
      return;
    }

    restart(playableSettings);
    setAnswer("");
    setOperations(createOperationSet(playableSettings));
  }

  function handlePauseCancel() {
    if (world.status === "running") {
      setStatus("paused");
      return;
    }

    if (world.status === "paused") {
      setStatus("running");
      return;
    }

    setStatus("ready");
  }

  function handleCancelGame() {
    if (
      typeof window !== "undefined" &&
      !window.confirm("¿Seguro que quieres cancelar la partida?")
    ) {
      return;
    }

    setAnswer("");
    setOperations(createOperationSet(settings));
    resetForSettings(settings);
  }

  return (
    <main
      className={`${running ? "h-dvh overflow-hidden px-2 py-2" : "min-h-dvh px-3 py-4 sm:px-5"} bg-[#0a0f1f] text-white`}
    >
      <div
        className={`mx-auto flex w-full max-w-6xl flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_390px] ${
          running ? "h-full gap-2 lg:gap-4" : "gap-4"
        }`}
      >
        <section className={`flex min-h-0 flex-col ${running ? "gap-2" : "gap-3"}`}>
          <div className={`flex items-center justify-between gap-3 ${running ? "shrink-0" : ""}`}>
            <div>
              <h1 className={`${running ? "text-xl" : "text-3xl"} font-black leading-none text-white`}>
                Math Pong
              </h1>
              <p className={`${running ? "mt-0 text-xs" : "mt-1 text-sm"} font-semibold text-teal-200`}>
                {statusText}
              </p>
            </div>
            <div className={`rounded-lg border border-white/10 bg-white/8 text-right ${running ? "px-2 py-1" : "px-3 py-2"}`}>
              <p className="text-[10px] font-semibold uppercase text-slate-300 sm:text-xs">Mejor tiempo</p>
              <p className={`${running ? "text-sm" : "text-lg"} font-black`}>{formatTime(highScore.survivalMs)}</p>
            </div>
          </div>

          <Scoreboard score={world.score} elapsedMs={world.elapsedMs} highScore={highScore} compact={running} />

          <div className={`relative min-h-0 ${running ? "shrink overflow-hidden lg:max-h-none" : ""}`}>
            <GameCanvas world={world} settings={settings} compact={running} />
            {world.status !== "running" && (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="max-w-xs rounded-lg border border-white/15 bg-slate-950/85 p-4 text-center shadow-2xl">
                  <p className="text-xl font-black">
                    {world.status === "gameOver"
                      ? "Juego terminado"
                      : world.status === "paused"
                        ? "Pausa"
                        : "Preparado"}
                  </p>
                  <p className="mt-2 text-sm text-slate-200">
                    Resuelve operaciones para mover la paleta izquierda antes de que llegue la pelota.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className={`flex min-h-0 flex-col ${running ? "gap-2" : "gap-3"}`}>
          <OperationGrid operations={operations} compact={running} />
          <AnswerInput value={answer} active={answerInputActive} compact={running} onChange={handleAnswer} />

          <div className={`grid grid-cols-2 ${running ? "gap-1.5" : "gap-2"}`}>
            <button
              type="button"
              onClick={handlePrimaryAction}
              className={`${running ? "h-10 text-sm" : "h-12 text-base"} rounded-lg bg-teal-300 px-4 font-black text-slate-950 transition active:scale-[0.98]`}
            >
              {world.status === "ready" ? "Empezar" : "Reiniciar"}
            </button>
            {(running || world.status === "paused") && (
              <button
                type="button"
                onClick={handlePauseCancel}
                className={`${running ? "h-10 text-sm" : "h-12 text-base"} rounded-lg border border-white/15 bg-white/10 px-4 font-black text-white transition active:scale-[0.98]`}
              >
                {world.status === "paused" ? "Seguir" : "Pausar"}
              </button>
            )}
            {!running && world.status !== "paused" && <div />}
          </div>

          {running && (
            <button
              type="button"
              onClick={handleCancelGame}
              className="h-10 rounded-lg border border-rose-300/40 bg-rose-300/12 px-4 text-sm font-black text-rose-50 transition active:scale-[0.98]"
            >
              Cancelar
            </button>
          )}

          {!running && <SettingsPanel settings={settings} disabled={running} onChange={updateSettings} />}
        </aside>
      </div>
    </main>
  );
}

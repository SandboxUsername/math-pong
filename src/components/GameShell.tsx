"use client";

import { useEffect, useMemo, useState } from "react";
import { AnswerInput } from "@/components/AnswerInput";
import { GameCanvas } from "@/components/GameCanvas";
import { OperationGrid } from "@/components/OperationGrid";
import { Scoreboard } from "@/components/Scoreboard";
import { SettingsPanel } from "@/components/SettingsPanel";
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

type ActiveTab = "game" | "settings";

export function GameShell() {
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [answer, setAnswer] = useState("");
  const [highScore, setHighScore] = useState<HighScore>(defaultHighScore);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("game");
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
    if (running) {
      setActiveTab("game");
    }
  }, [running]);

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
    setActiveTab("game");

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
    <main className={`${running ? "min-h-svh px-2 py-2" : "min-h-dvh px-3 py-4 sm:px-5"} bg-[#0a0f1f] text-white`}>
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-3">
        {!running && (
          <>
            <Header statusText={statusText} />
            <TabBar activeTab={activeTab} onChange={setActiveTab} />
          </>
        )}

        {activeTab === "settings" && !running ? (
          <section className="min-h-0 overflow-auto pb-6">
            <SettingsPanel settings={settings} disabled={running} onChange={updateSettings} />
          </section>
        ) : (
          <section className={`flex min-h-0 flex-1 flex-col ${running ? "gap-1.5 pb-8" : "gap-3"}`}>
            {running ? (
              <ActiveGameLayout
                answer={answer}
                answerInputActive={answerInputActive}
                highScore={highScore}
                onAnswer={handleAnswer}
                onCancel={handleCancelGame}
                onPauseResume={handlePauseCancel}
                onPrimary={handlePrimaryAction}
                operations={operations}
                settings={settings}
                world={world}
              />
            ) : (
              <SetupGameLayout
                answer={answer}
                answerInputActive={answerInputActive}
                highScore={highScore}
                onAnswer={handleAnswer}
                onPauseResume={handlePauseCancel}
                onPrimary={handlePrimaryAction}
                operations={operations}
                settings={settings}
                status={world.status}
                world={world}
              />
            )}
          </section>
        )}
      </div>
    </main>
  );
}

type LayoutProps = {
  answer: string;
  answerInputActive: boolean;
  highScore: HighScore;
  onAnswer: (value: string) => void;
  onPauseResume: () => void;
  onPrimary: () => void;
  operations: Operation[];
  settings: GameSettings;
  world: ReturnType<typeof useGameLoop>["world"];
};

type ActiveLayoutProps = LayoutProps & {
  onCancel: () => void;
};

function ActiveGameLayout({
  answer,
  answerInputActive,
  highScore,
  onAnswer,
  onCancel,
  onPauseResume,
  onPrimary,
  operations,
  settings,
  world
}: ActiveLayoutProps) {
  return (
    <>
      <OperationGrid compact gameplay kinds={["add", "multiply"]} operations={operations} />
      <div className="relative min-h-0 shrink overflow-hidden">
        <GameCanvas world={world} settings={settings} compact />
      </div>
      <OperationGrid compact gameplay kinds={["subtract", "divide"]} operations={operations} />
      <AnswerInput value={answer} active={answerInputActive} compact onChange={onAnswer} />
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={onPrimary}
          className="h-10 rounded-lg bg-teal-300 px-4 text-sm font-black text-slate-950 transition active:scale-[0.98]"
        >
          Reiniciar
        </button>
        <button
          type="button"
          onClick={onPauseResume}
          className="h-10 rounded-lg border border-white/15 bg-white/10 px-4 text-sm font-black text-white transition active:scale-[0.98]"
        >
          Pausar
        </button>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="h-10 rounded-lg border border-rose-300/40 bg-rose-300/12 px-4 text-sm font-black text-rose-50 transition active:scale-[0.98]"
      >
        Cancelar
      </button>
      <div className="pb-2">
        <Scoreboard score={world.score} elapsedMs={world.elapsedMs} highScore={highScore} compact />
      </div>
    </>
  );
}

type SetupLayoutProps = LayoutProps & {
  status: string;
};

function SetupGameLayout({
  answer,
  answerInputActive,
  highScore,
  onAnswer,
  onPauseResume,
  onPrimary,
  operations,
  settings,
  status,
  world
}: SetupLayoutProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_390px]">
      <section className="flex min-h-0 flex-col gap-3">
        <Scoreboard score={world.score} elapsedMs={world.elapsedMs} highScore={highScore} />
        <div className="relative">
          <GameCanvas world={world} settings={settings} />
          {status !== "running" && (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="max-w-xs rounded-lg border border-white/15 bg-slate-950/85 p-4 text-center shadow-2xl">
                <p className="text-xl font-black">
                  {status === "gameOver" ? "Juego terminado" : status === "paused" ? "Pausa" : "Preparado"}
                </p>
                <p className="mt-2 text-sm text-slate-200">
                  Resuelve operaciones para mover la paleta izquierda antes de que llegue la pelota.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <aside className="flex flex-col gap-3">
        <OperationGrid operations={operations} />
        <AnswerInput value={answer} active={answerInputActive} onChange={onAnswer} />
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onPrimary}
            className="h-12 rounded-lg bg-teal-300 px-4 text-base font-black text-slate-950 transition active:scale-[0.98]"
          >
            {status === "ready" ? "Empezar" : "Reiniciar"}
          </button>
          {(status === "running" || status === "paused") && (
            <button
              type="button"
              onClick={onPauseResume}
              className="h-12 rounded-lg border border-white/15 bg-white/10 px-4 text-base font-black text-white transition active:scale-[0.98]"
            >
              {status === "paused" ? "Seguir" : "Pausar"}
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

function Header({ statusText }: { statusText: string }) {
  return (
    <header>
      <div>
        <h1 className="text-3xl font-black leading-none text-white">Math Pong</h1>
        <p className="mt-1 text-sm font-semibold text-teal-200">{statusText}</p>
      </div>
    </header>
  );
}

function TabBar({
  activeTab,
  onChange
}: {
  activeTab: ActiveTab;
  onChange: (tab: ActiveTab) => void;
}) {
  return (
    <nav className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-white/7 p-1">
      <button
        type="button"
        onClick={() => onChange("settings")}
        className={`h-10 rounded-md text-sm font-black transition ${
          activeTab === "settings" ? "bg-teal-300 text-slate-950" : "text-white"
        }`}
      >
        Ajustes
      </button>
      <button
        type="button"
        onClick={() => onChange("game")}
        className={`h-10 rounded-md text-sm font-black transition ${
          activeTab === "game" ? "bg-teal-300 text-slate-950" : "text-white"
        }`}
      >
        Juego
      </button>
    </nav>
  );
}

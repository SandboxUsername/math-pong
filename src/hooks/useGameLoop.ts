"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createInitialWorld, movePaddle, stepWorld } from "@/lib/gameLogic";
import type { GameSettings, GameStatus, GameWorld, MovementAction } from "@/types/game";

export function useGameLoop(settings: GameSettings) {
  const [world, setWorld] = useState<GameWorld>(() => createInitialWorld(settings));
  const frameRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (world.status !== "running") {
      previousTimeRef.current = null;
      return;
    }

    const tick = (time: number) => {
      const previous = previousTimeRef.current ?? time;
      previousTimeRef.current = time;
      setWorld((current) => stepWorld(current, time - previous, settingsRef.current));
      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [world.status]);

  const start = useCallback(() => {
    setWorld((current) => ({
      ...current,
      status: "running"
    }));
  }, []);

  const restart = useCallback((nextSettings?: GameSettings) => {
    setWorld({
      ...createInitialWorld(nextSettings ?? settingsRef.current),
      status: "running"
    });
  }, []);

  const setStatus = useCallback((status: GameStatus) => {
    setWorld((current) => ({ ...current, status }));
  }, []);

  const executeMovement = useCallback((action: MovementAction) => {
    setWorld((current) => movePaddle(current, action, settingsRef.current));
  }, []);

  const resetForSettings = useCallback((nextSettings?: GameSettings) => {
    setWorld(createInitialWorld(nextSettings ?? settingsRef.current));
  }, []);

  return {
    world,
    start,
    restart,
    setStatus,
    executeMovement,
    resetForSettings
  };
}

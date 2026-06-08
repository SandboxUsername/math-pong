import type { GameSettings, HighScore } from "@/types/game";

const SETTINGS_KEY = "math-pong-settings";
const HIGH_SCORE_KEY = "math-pong-high-score";

export const defaultSettings: GameSettings = {
  operations: {
    add: { min: 1, max: 20 },
    subtract: { min: 1, max: 20 },
    multiply: { min: 2, max: 12 },
    divide: { min: 2, max: 12 }
  },
  easyMovementMultiplier: 1,
  hardMovementMultiplier: 2,
  ballSpeed: 0.5,
  showLaneGuides: true,
  showTrajectoryGuide: true,
  durationSeconds: null
};

export function normalizeSettings(settings: GameSettings): GameSettings {
  const migratedBallSpeed = settings.ballSpeed > 20 ? settings.ballSpeed / 100 : settings.ballSpeed;

  return {
    operations: {
      add: normalizeRange(settings.operations.add),
      subtract: normalizeRange(settings.operations.subtract),
      multiply: normalizeRange(settings.operations.multiply),
      divide: normalizeRange(settings.operations.divide)
    },
    easyMovementMultiplier: clampNumber(settings.easyMovementMultiplier, 0.1, 5),
    hardMovementMultiplier: clampNumber(settings.hardMovementMultiplier, 0.1, 10),
    ballSpeed: clampNumber(migratedBallSpeed, 0.1, 20),
    showLaneGuides: settings.showLaneGuides,
    showTrajectoryGuide: settings.showTrajectoryGuide,
    durationSeconds:
      settings.durationSeconds && settings.durationSeconds > 0
        ? clampNumber(settings.durationSeconds, 1, 600)
        : null
  };
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function normalizeRange(range: GameSettings["operations"]["add"]) {
  return {
    min: Math.round(clampNumber(range.min, 1, 99)),
    max: Math.round(clampNumber(range.max, 1, 99))
  };
}

export const defaultHighScore: HighScore = {
  score: 0,
  survivalMs: 0
};

export function loadSettings(): GameSettings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  try {
    const saved = window.localStorage.getItem(SETTINGS_KEY);
    if (!saved) return defaultSettings;
    const parsed = JSON.parse(saved) as Partial<GameSettings>;

    return normalizeSettings({
      ...defaultSettings,
      ...parsed,
      operations: {
        ...defaultSettings.operations,
        ...parsed.operations
      }
    });
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: GameSettings) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadHighScore(): HighScore {
  if (typeof window === "undefined") {
    return defaultHighScore;
  }

  try {
    const saved = window.localStorage.getItem(HIGH_SCORE_KEY);
    return saved ? { ...defaultHighScore, ...JSON.parse(saved) } : defaultHighScore;
  } catch {
    return defaultHighScore;
  }
}

export function saveHighScore(highScore: HighScore) {
  window.localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(highScore));
}

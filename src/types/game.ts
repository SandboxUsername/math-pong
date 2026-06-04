export type OperationKind = "add" | "subtract" | "multiply" | "divide";

export type MovementAction = "smallUp" | "smallDown" | "bigUp" | "bigDown";

export type GameStatus = "ready" | "running" | "paused" | "gameOver";

export type Range = {
  min: number;
  max: number;
};

export type OperationSettings = {
  add: Range;
  subtract: Range;
  multiply: Range;
  divide: Range;
};

export type GameSettings = {
  operations: OperationSettings;
  easyMovementMultiplier: number;
  hardMovementMultiplier: number;
  ballSpeed: number;
  showLaneGuides: boolean;
  showTrajectoryGuide: boolean;
  durationSeconds: number | null;
};

export type Operation = {
  id: string;
  kind: OperationKind;
  action: MovementAction;
  label: string;
  answer: number;
};

export type Paddle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Ball = {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  speed: number;
};

export type GameWorld = {
  width: number;
  height: number;
  paddle: Paddle;
  ball: Ball;
  score: number;
  elapsedMs: number;
  status: GameStatus;
};

export type HighScore = {
  score: number;
  survivalMs: number;
};

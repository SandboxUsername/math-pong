import type { Ball, GameSettings, GameStatus, GameWorld, MovementAction, Paddle } from "@/types/game";

export const WORLD_WIDTH = 720;
export const WORLD_HEIGHT = 430;

const PADDLE_MARGIN = 28;
const PADDLE_WIDTH = 16;
const BALL_RADIUS = 9;
const SPEEDUP_PER_HIT = 1.045;
const BALL_SPEED_SCALE = 100;
const PADDLE_HEIGHT_RATIO = 0.22;
const MAX_PADDLE_BOUNCE_ANGLE = (55 * Math.PI) / 180;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function initialBall(settings: GameSettings): Ball {
  const angle = (Math.random() * 0.7 - 0.35) || 0.2;
  const speed = settings.ballSpeed * BALL_SPEED_SCALE;

  return {
    x: WORLD_WIDTH * 0.62,
    y: WORLD_HEIGHT * 0.5,
    radius: BALL_RADIUS,
    vx: -Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    speed
  };
}

export function createInitialWorld(settings: GameSettings): GameWorld {
  const paddleHeight = getPaddleHeight(WORLD_HEIGHT);

  return {
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    paddle: {
      x: PADDLE_MARGIN,
      y: WORLD_HEIGHT / 2 - paddleHeight / 2,
      width: PADDLE_WIDTH,
      height: paddleHeight
    },
    ball: initialBall(settings),
    score: 0,
    elapsedMs: 0,
    status: "ready"
  };
}

function getPaddleHeight(worldHeight: number) {
  return clamp(worldHeight * PADDLE_HEIGHT_RATIO, 20, 300);
}

function paddleBounce(ball: Ball, paddle: Paddle): Ball {
  const speed = ball.speed;
  const hitPoint = clamp((ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2), -1, 1);
  const angle = hitPoint * MAX_PADDLE_BOUNCE_ANGLE;

  return {
    ...ball,
    x: paddle.x + paddle.width + ball.radius,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed
  };
}

function circleHitsPaddle(ball: Ball, paddle: Paddle) {
  const nearestX = clamp(ball.x, paddle.x, paddle.x + paddle.width);
  const nearestY = clamp(ball.y, paddle.y, paddle.y + paddle.height);
  const dx = ball.x - nearestX;
  const dy = ball.y - nearestY;

  return dx * dx + dy * dy <= ball.radius * ball.radius;
}

export function movePaddle(world: GameWorld, action: MovementAction, settings: GameSettings): GameWorld {
  const multiplier =
    action === "smallUp" || action === "smallDown"
      ? settings.easyMovementMultiplier
      : settings.hardMovementMultiplier;
  const amount = world.paddle.height * multiplier;
  const direction = action === "smallUp" || action === "bigUp" ? -1 : 1;
  const y = clamp(world.paddle.y + amount * direction, 0, world.height - world.paddle.height);

  return {
    ...world,
    paddle: {
      ...world.paddle,
      y
    }
  };
}

export function stepWorld(world: GameWorld, deltaMs: number, settings: GameSettings): GameWorld {
  if (world.status !== "running") return world;

  const deltaSeconds = Math.min(deltaMs, 32) / 1000;
  let ball: Ball = {
    ...world.ball,
    x: world.ball.x + world.ball.vx * deltaSeconds,
    y: world.ball.y + world.ball.vy * deltaSeconds
  };
  let score = world.score;
  let status: GameStatus = world.status;

  if (ball.y - ball.radius <= 0) {
    ball = { ...ball, y: ball.radius, vy: Math.abs(ball.vy) };
  }

  if (ball.y + ball.radius >= world.height) {
    ball = { ...ball, y: world.height - ball.radius, vy: -Math.abs(ball.vy) };
  }

  if (ball.x + ball.radius >= world.width) {
    ball = { ...ball, x: world.width - ball.radius, vx: -Math.abs(ball.vx) };
  }

  if (ball.vx < 0 && circleHitsPaddle(ball, world.paddle)) {
    score += 1;
    ball = paddleBounce({ ...ball, speed: ball.speed * SPEEDUP_PER_HIT }, world.paddle);
  }

  if (ball.x + ball.radius < 0) {
    status = "gameOver";
  }

  const elapsedMs = world.elapsedMs + deltaMs;
  if (settings.durationSeconds && elapsedMs >= settings.durationSeconds * 1000) {
    status = "gameOver";
  }

  return {
    ...world,
    ball,
    score,
    elapsedMs,
    status
  };
}

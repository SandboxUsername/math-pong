"use client";

import { useEffect, useRef } from "react";
import type { Ball, GameSettings, GameWorld } from "@/types/game";

type Props = {
  world: GameWorld;
  settings: Pick<GameSettings, "showLaneGuides" | "showTrajectoryGuide">;
  compact?: boolean;
};

export function GameCanvas({ world, settings, compact = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = world.width * pixelRatio;
    canvas.height = world.height * pixelRatio;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, world.width, world.height);

    const gradient = context.createLinearGradient(0, 0, world.width, world.height);
    gradient.addColorStop(0, "#111827");
    gradient.addColorStop(0.55, "#172554");
    gradient.addColorStop(1, "#0f172a");
    context.fillStyle = gradient;
    context.fillRect(0, 0, world.width, world.height);

    if (settings.showLaneGuides) {
      drawLaneGuides(context, world);
    }

    context.strokeStyle = "rgba(248, 250, 252, 0.18)";
    context.lineWidth = 2;
    context.setLineDash([8, 14]);
    context.beginPath();
    context.moveTo(world.width / 2, 18);
    context.lineTo(world.width / 2, world.height - 18);
    context.stroke();
    context.setLineDash([]);

    context.fillStyle = "rgba(248, 250, 252, 0.28)";
    context.fillRect(world.width - 12, 0, 5, world.height);

    if (settings.showTrajectoryGuide) {
      drawTrajectoryGuide(context, world);
    }

    context.fillStyle = "#f8fafc";
    context.shadowColor = "rgba(45, 212, 191, 0.65)";
    context.shadowBlur = 16;
    context.fillRect(world.paddle.x, world.paddle.y, world.paddle.width, world.paddle.height);

    context.beginPath();
    context.arc(world.ball.x, world.ball.y, world.ball.radius, 0, Math.PI * 2);
    context.fillStyle = "#facc15";
    context.shadowColor = "rgba(250, 204, 21, 0.85)";
    context.shadowBlur = 18;
    context.fill();
    context.shadowBlur = 0;

    if (world.status === "gameOver" || world.status === "paused" || world.status === "ready") {
      context.fillStyle = "rgba(2, 6, 23, 0.52)";
      context.fillRect(0, 0, world.width, world.height);
    }
  }, [settings.showLaneGuides, settings.showTrajectoryGuide, world]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Campo de juego Math Pong"
      className={`${compact ? "max-h-[28dvh]" : ""} h-auto w-full rounded-lg border border-white/10 bg-slate-950`}
      style={{ aspectRatio: `${world.width} / ${world.height}` }}
    />
  );
}

function drawLaneGuides(context: CanvasRenderingContext2D, world: GameWorld) {
  context.save();
  context.strokeStyle = "rgba(255, 255, 255, 0.07)";
  context.lineWidth = 1;

  for (let y = world.paddle.height; y < world.height; y += world.paddle.height) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(world.width, y);
    context.stroke();
  }

  context.restore();
}

function drawTrajectoryGuide(context: CanvasRenderingContext2D, world: GameWorld) {
  const points = predictTrajectory(world);
  if (points.length < 2) return;

  context.save();
  context.strokeStyle = "rgba(250, 204, 21, 0.22)";
  context.lineWidth = 2;
  context.setLineDash([9, 9]);
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
  context.stroke();
  context.setLineDash([]);
  context.restore();
}

function predictTrajectory(world: GameWorld) {
  const ball: Ball = { ...world.ball };
  const points = [{ x: ball.x, y: ball.y }];
  const targetX = world.paddle.x + world.paddle.width + ball.radius;
  const rightX = world.width - ball.radius;
  const topY = ball.radius;
  const bottomY = world.height - ball.radius;
  let x = ball.x;
  let y = ball.y;
  let vx = ball.vx;
  let vy = ball.vy;

  for (let segment = 0; segment < 12; segment += 1) {
    if (vx < 0 && x <= targetX) break;

    const candidates: Array<{ time: number; type: "top" | "bottom" | "right" | "target" }> = [];

    if (vy < 0) candidates.push({ time: (topY - y) / vy, type: "top" });
    if (vy > 0) candidates.push({ time: (bottomY - y) / vy, type: "bottom" });
    if (vx > 0) candidates.push({ time: (rightX - x) / vx, type: "right" });
    if (vx < 0) candidates.push({ time: (targetX - x) / vx, type: "target" });

    const next = candidates
      .filter((candidate) => Number.isFinite(candidate.time) && candidate.time > 0.0001)
      .sort((a, b) => a.time - b.time)[0];

    if (!next) break;

    x += vx * next.time;
    y += vy * next.time;
    points.push({ x, y });

    if (next.type === "target") break;
    if (next.type === "right") vx = -Math.abs(vx);
    if (next.type === "top") vy = Math.abs(vy);
    if (next.type === "bottom") vy = -Math.abs(vy);
  }

  return points;
}

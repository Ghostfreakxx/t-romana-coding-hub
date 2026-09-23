"use client";

import { useEffect, useRef, useState } from "react";

type Control = "left" | "right" | "accelerate" | "brake";
type Car = { distance: number; lane: number; color: string };
type Game = { distance: number; speed: number; position: number; hits: number; passed: number; lastHit: number; running: boolean };

const WIDTH = 960;
const HEIGHT = 540;
const HORIZON = 160;
const COLORS = ["#f6b35d", "#8ed6f0", "#ef8b99", "#ddc9f9"];
const TRAFFIC: Car[] = Array.from({ length: 110 }, (_, index) => ({
  distance: 90 + index * 83,
  lane: [-0.58, 0, 0.58, 0, -0.58, 0.58][index % 6],
  color: COLORS[index % COLORS.length],
}));
const freshGame = (): Game => ({ distance: 0, speed: 0, position: 0, hits: 0, passed: 0, lastHit: -100, running: false });
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function draw(ctx: CanvasRenderingContext2D, game: Game) {
  const { distance, speed, position } = game;
  const fill = (color: string, x: number, y: number, w: number, h: number) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
  const project = (ahead: number) => {
    const scale = 1 / (1 + Math.max(0, ahead) / 90);
    return { y: HORIZON + (HEIGHT - HORIZON) * scale, half: 45 + 380 * scale, scale };
  };

  fill("#a9d3e7", 0, 0, WIDTH, HORIZON);
  fill("#b2d18e", 0, HORIZON, WIDTH, HEIGHT - HORIZON);
  ctx.fillStyle = "#779c70";
  ctx.beginPath(); ctx.moveTo(0, HORIZON); ctx.lineTo(90, 98); ctx.lineTo(220, HORIZON); ctx.lineTo(360, 114); ctx.lineTo(520, HORIZON); ctx.fill();
  ctx.beginPath(); ctx.moveTo(490, HORIZON); ctx.lineTo(680, 100); ctx.lineTo(790, HORIZON); ctx.lineTo(880, 122); ctx.lineTo(WIDTH, HORIZON); ctx.fill();
  for (let y = HORIZON; y < HEIGHT; y += 3) {
    const t = (y - HORIZON) / (HEIGHT - HORIZON);
    const half = 45 + 380 * t;
    fill("#f2eee0", WIDTH / 2 - half - 9, y, 9, 4);
    fill("#424a4b", WIDTH / 2 - half, y, half * 2, 4);
    fill("#f2eee0", WIDTH / 2 + half, y, 9, 4);
  }
  for (let marker = Math.floor(distance / 16) * 16; marker < distance + 420; marker += 16) {
    const ahead = marker - distance;
    if (ahead < 0 || (marker / 16) % 2 === 1) continue;
    const near = project(ahead);
    const far = project(ahead + 8);
    for (const side of [-1, 1]) {
      const x1 = WIDTH / 2 + side * near.half / 3;
      const x2 = WIDTH / 2 + side * far.half / 3;
      ctx.fillStyle = "#f5eac2";
      ctx.beginPath(); ctx.moveTo(x1 - 2 * near.scale, near.y); ctx.lineTo(x1 + 2 * near.scale, near.y);
      ctx.lineTo(x2 + 2 * far.scale, far.y); ctx.lineTo(x2 - 2 * far.scale, far.y); ctx.fill();
    }
  }
  for (let tree = Math.floor(distance / 38) * 38; tree < distance + 410; tree += 38) {
    const ahead = tree - distance;
    if (ahead < 0) continue;
    const { y, half, scale } = project(ahead);
    for (const side of [-1, 1]) {
      const x = WIDTH / 2 + side * (half + 42 * scale);
      fill("#72553a", x - 5 * scale, y - 48 * scale, 10 * scale, 48 * scale);
      ctx.fillStyle = "#2d7551";
      ctx.beginPath(); ctx.arc(x, y - 57 * scale, 23 * scale, 0, Math.PI * 2); ctx.fill();
    }
  }
  for (const traffic of TRAFFIC.slice().reverse()) {
    const ahead = traffic.distance - distance;
    if (ahead < -5 || ahead > 360) continue;
    const { y, half, scale } = project(ahead);
    const w = 74 * scale;
    const h = 112 * scale;
    const x = WIDTH / 2 + traffic.lane * half * 0.7 - w / 2;
    fill("#202b2b", x + w * 0.12, y - h * 0.14, w * 0.76, h * 0.15);
    fill(traffic.color, x, y - h, w, h * 0.9);
    fill("#263f50", x + w * 0.14, y - h * 0.83, w * 0.72, h * 0.31);
    fill("#ffe59e", x + w * 0.07, y - h * 0.16, w * 0.19, h * 0.08);
    fill("#ffe59e", x + w * 0.74, y - h * 0.16, w * 0.19, h * 0.08);
  }
  const playerX = WIDTH / 2 + position * 285;
  fill("#293238", playerX - 63, 473, 126, 23);
  fill("#cced91", playerX - 56, 384, 112, 94);
  fill("#294454", playerX - 43, 398, 86, 32);
  fill("#f04747", playerX - 52, 449, 23, 12);
  fill("#f04747", playerX + 29, 449, 23, 12);
  fill("#263238", playerX - 37, 460, 74, 10);
  ctx.fillStyle = "#15231b";
  ctx.font = "bold 24px Arial";
  ctx.fillText(`${Math.round(speed)} km/h`, 30, 45);
  ctx.font = "16px Arial";
  ctx.fillText(`${Math.floor(distance)} m  ·  Passed ${game.passed}  ·  Collisions ${game.hits}`, 30, 75);
  if (!game.running) {
    fill("#101911ad", 0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = "bold 34px Arial";
    ctx.fillText(distance === 0 ? "Ready to drive?" : "Paused", WIDTH / 2, 236);
    ctx.font = "19px Arial";
    ctx.fillText("Press Start to practice steering and braking", WIDTH / 2, 275);
    ctx.textAlign = "left";
  }
}

export default function DrivingSimulator() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const game = useRef<Game>(freshGame());
  const controls = useRef(new Set<Control>());
  const [display, setDisplay] = useState({ speed: 0, distance: 0, hits: 0, passed: 0, running: false });
  const [message, setMessage] = useState("Keep your speed below 60 km/h and give other vehicles space.");

  useEffect(() => {
    let frame = 0;
    let last = 0;
    let lastDisplay = 0;
    const render = (now: number) => {
      const gameState = game.current;
      const delta = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      if (gameState.running) {
        const keys = controls.current;
        const pedal = keys.has("accelerate") ? 24 : keys.has("brake") ? -60 : -12;
        gameState.speed = clamp(gameState.speed + pedal * delta, 0, 90);
        const steer = Number(keys.has("right")) - Number(keys.has("left"));
        gameState.position = clamp(gameState.position + steer * delta * (0.35 + gameState.speed / 125), -1.08, 1.08);
        if (Math.abs(gameState.position) > 0.97) {
          gameState.speed = Math.max(0, gameState.speed - 35 * delta);
        }
        gameState.distance += gameState.speed / 3.6 * delta;
        gameState.passed = TRAFFIC.filter(car => car.distance < gameState.distance - 6).length;
        for (const car of TRAFFIC) {
          if (Math.abs(car.distance - gameState.distance) < 3 && Math.abs(car.lane - gameState.position) < 0.29 && gameState.speed > 3 && gameState.distance - gameState.lastHit > 15) {
            gameState.hits++;
            gameState.lastHit = gameState.distance;
            gameState.speed = 0;
            setMessage("Collision! Brake earlier and move into a clear lane.");
            break;
          }
        }
        if (gameState.distance >= TRAFFIC[TRAFFIC.length - 1].distance + 30) {
          gameState.running = false;
          setMessage("Course complete. Reset to try again.");
        }
      }
      const context = canvas.current?.getContext("2d");
      if (context) draw(context, gameState);
      if (now - lastDisplay > 150) {
        setDisplay({ speed: Math.round(gameState.speed), distance: Math.floor(gameState.distance), hits: gameState.hits, passed: gameState.passed, running: gameState.running });
        lastDisplay = now;
      }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    const down = (event: KeyboardEvent) => {
      const keys: Record<string, Control> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "accelerate", ArrowDown: "brake", a: "left", d: "right", w: "accelerate", s: "brake", " ": "brake" };
      if (keys[event.key] && !["INPUT", "TEXTAREA", "SELECT"].includes((event.target as HTMLElement).tagName)) {
        event.preventDefault(); controls.current.add(keys[event.key]);
      }
    };
    const up = (event: KeyboardEvent) => {
      const keys: Record<string, Control> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "accelerate", ArrowDown: "brake", a: "left", d: "right", w: "accelerate", s: "brake", " ": "brake" };
      if (keys[event.key]) controls.current.delete(keys[event.key]);
    };
    const release = () => controls.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", release);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", release);
    };
  }, []);

  const controlButton = (label: string, control: Control) => (
    <button key={control} type="button" className="drive-control" aria-label={label}
      onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); controls.current.add(control); }}
      onPointerUp={() => controls.current.delete(control)}
      onPointerCancel={() => controls.current.delete(control)}
      onLostPointerCapture={() => controls.current.delete(control)}>{label}</button>
  );

  return <section className="panel driving-simulator" aria-label="Graphic driving practice">
    <div className="row between"><div><h2>Live driving practice</h2><p className="muted small">A simple visual practice course. This is a game, not a substitute for road instruction.</p></div><span className="tag">{display.running ? "DRIVING" : "PAUSED"}</span></div>
    <canvas ref={canvas} width={WIDTH} height={HEIGHT} className="drive-canvas" role="img" aria-label={`Driving view. Speed ${display.speed} kilometres per hour. Distance ${display.distance} metres. Vehicles passed ${display.passed}. Collisions ${display.hits}.`}/>
    <div className="row drive-actions"><button type="button" className="btn" onClick={() => { game.current.running = !game.current.running; controls.current.clear(); }}>{display.running ? "Pause" : "Start driving"}</button><button type="button" className="btn secondary" onClick={() => { game.current = freshGame(); controls.current.clear(); setMessage("Keep your speed below 60 km/h and give other vehicles space."); }}>Reset course</button><span className="small muted">{display.speed} km/h · {display.distance} m · {display.passed} passed · {display.hits} collisions</span></div>
    <div className="drive-controls" aria-label="Touch driving controls"><div>{controlButton("← Left", "left")}{controlButton("Right →", "right")}</div><div>{controlButton("Brake", "brake")}{controlButton("Accelerate", "accelerate")}</div></div>
    <p className="small muted">Keyboard: arrow keys or W A S D. Hold ↑ to accelerate, ↓ or Space to brake. On a phone, hold the buttons above. Leaving the road slows the car.</p>
    <p className="notice" role="status">{message}{display.speed > 60 ? " Slow down: you are above the practice speed limit." : ""}</p>
  </section>;
}

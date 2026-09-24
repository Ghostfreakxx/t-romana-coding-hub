export type Weather = "day" | "rain" | "night";
export type Traffic = { id: number; z: number; lane: number; speed: number; hit: boolean; passed: boolean };
export type DriveState = { distance: number; speed: number; position: number; steering: number; elapsed: number; hits: number; passed: number; score: number; running: boolean; finished: boolean; weather: Weather; traffic: Traffic[] };
export const ROUTE_LENGTH = 1200;
export const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
export const speedLimit = (weather: Weather) => weather === "rain" ? 45 : 60;
export function newDrive(weather: Weather = "day"): DriveState {
  return { distance: 0, speed: 0, position: -0.58, steering: 0, elapsed: 0, hits: 0, passed: 0, score: 100, running: false, finished: false, weather,
    traffic: Array.from({ length: 18 }, (_, id) => ({ id, z: 85 + id * 85, lane: [-0.58, 0.58, 0][id % 3], speed: 15 + id % 4 * 4, hit: false, passed: false })) };
}
export function stepDrive(s: DriveState, seconds: number, input: { throttle: boolean; brake: boolean; steer: number }) {
  if (!s.running || s.finished) return;
  const dt = clamp(seconds, 0, 0.05);
  s.elapsed += dt;
  s.steering += (clamp(input.steer, -1, 1) - s.steering) * Math.min(1, dt * 9);
  s.speed = clamp(s.speed + (input.brake ? -55 : input.throttle ? 21 : -9) * dt, 0, 85);
  s.position = clamp(s.position + s.steering * dt * s.speed / 48, -1.2, 1.2);
  if (Math.abs(s.position) > 0.93) { s.speed = Math.max(0, s.speed - 32 * dt); s.score -= dt * 4; }
  if (s.speed > speedLimit(s.weather)) s.score -= dt * 1.5;
  s.distance += s.speed / 3.6 * dt;
  for (const car of s.traffic) {
    car.z += car.speed / 3.6 * dt;
    const gap = car.z - s.distance;
    if (!car.hit && Math.abs(gap) < 5.5 && Math.abs(car.lane - s.position) < 0.25) {
      car.hit = true; s.hits++; s.score -= 15; s.speed = Math.min(s.speed, car.speed * 0.5);
    }
    if (!car.passed && gap < -7) { car.passed = true; s.passed++; }
  }
  s.score = clamp(s.score, 0, 100);
  if (s.distance >= ROUTE_LENGTH) { s.distance = ROUTE_LENGTH; s.finished = true; s.running = false; s.speed = 0; }
}

export type CircuitMode = "series" | "parallel";
export function circuitReadings(volts: number, r1: number, r2: number, mode: CircuitMode, closed: boolean) {
  if (![volts, r1, r2].every(Number.isFinite) || volts < 0 || r1 <= 0 || r2 <= 0) throw Error("Use positive resistances and a non-negative voltage.");
  const resistance = mode === "series" ? r1 + r2 : 1 / (1 / r1 + 1 / r2);
  const current = closed ? volts / resistance : 0;
  const i1 = closed ? mode === "series" ? current : volts / r1 : 0;
  const i2 = closed ? mode === "series" ? current : volts / r2 : 0;
  // A is battery +; B is the series midpoint or powered parallel rail; C is battery −.
  const nodes = { A: volts, B: closed ? mode === "series" ? current * r2 : volts : 0, C: 0 };
  return { resistance, current, i1, i2, power: volts * current, v1: i1 * r1, v2: i2 * r2, nodes };
}

/** Standard 4-band colour code: two digits, a multiplier and a tolerance band. */
export const BAND_COLOURS = ["black", "brown", "red", "orange", "yellow", "green", "blue", "violet", "grey", "white"] as const;
export const BAND_HEX = ["#101719", "#68452c", "#b3332c", "#d9792b", "#e3c33b", "#3f8a5c", "#3463b4", "#86569a", "#80878b", "#f4efdd"];
/** E12 preferred values, the series most beginner kits use. */
export const E12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82];
export function resistorBands(ohms: number): [number, number, number] {
  if (!Number.isFinite(ohms) || ohms < 10) throw Error("Use a value of at least 10 Ω.");
  const exponent = Math.floor(Math.log10(ohms)) - 1, digits = Math.round(ohms / 10 ** exponent);
  if (digits < 10 || digits > 99 || Math.abs(digits * 10 ** exponent - ohms) > ohms * 1e-9) throw Error("Use a value with two significant digits.");
  return [Math.floor(digits / 10), digits % 10, exponent];
}
export const bandsToOhms = ([a, b, m]: [number, number, number]) => Math.round((a * 10 + b) * 10 ** m * 1e6) / 1e6;
export function formatOhms(ohms: number) {
  if (ohms >= 1e6) return `${+(ohms / 1e6).toFixed(2)} MΩ`;
  if (ohms >= 1e3) return `${+(ohms / 1e3).toFixed(2)} kΩ`;
  return `${+ohms.toFixed(2)} Ω`;
}

export type PredictKind = "current" | "resistance" | "v2" | "power";
export type Prediction = { mode: CircuitMode; volts: number; r1: number; r2: number; kind: PredictKind };
/** The value a student should predict, in the unit the question asks for (mA, Ω, V or mW). */
export function predictAnswer(p: Prediction) {
  const r = circuitReadings(p.volts, p.r1, p.r2, p.mode, true);
  return p.kind === "current" ? r.current * 1000 : p.kind === "resistance" ? r.resistance : p.kind === "v2" ? r.v2 : r.power * 1000;
}
/** Accepts answers within 2 % (or 0.05 units for small values) so rounding is not punished. */
export const predictionCorrect = (p: Prediction, answer: number) => Number.isFinite(answer) && Math.abs(answer - predictAnswer(p)) <= Math.max(.05, Math.abs(predictAnswer(p)) * .02);

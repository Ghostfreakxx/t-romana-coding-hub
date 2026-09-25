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

/** Synthesized car sounds for the driving lab: engine hum, indicator ticks and a warning chime. Starts only after a tap. */
export class DriveAudio {
  private ctx: AudioContext | null = null;
  private engine: OscillatorNode | null = null;
  private engineSub: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private master: GainNode | null = null;
  async start() {
    this.ctx ??= new AudioContext();
    if (this.ctx.state === "suspended") await this.ctx.resume();
    if (this.engine) return;
    const ctx = this.ctx;
    this.master = ctx.createGain(); this.master.gain.value = .5; this.master.connect(ctx.destination);
    this.filter = ctx.createBiquadFilter(); this.filter.type = "lowpass"; this.filter.frequency.value = 420; this.filter.Q.value = 2;
    this.engineGain = ctx.createGain(); this.engineGain.gain.value = 0;
    this.engine = ctx.createOscillator(); this.engine.type = "sawtooth"; this.engine.frequency.value = 38;
    this.engineSub = ctx.createOscillator(); this.engineSub.type = "square"; this.engineSub.frequency.value = 19;
    const subGain = ctx.createGain(); subGain.gain.value = .35;
    this.engine.connect(this.filter); this.engineSub.connect(subGain); subGain.connect(this.filter);
    this.filter.connect(this.engineGain); this.engineGain.connect(this.master);
    this.engine.start(); this.engineSub.start();
  }
  /** Follows road speed; pressing GO adds load, like a real engine under throttle. */
  update(speed: number, throttle: boolean, running: boolean) {
    const ctx = this.ctx; if (!ctx || !this.engine || !this.engineSub || !this.filter || !this.engineGain) return;
    const t = ctx.currentTime, gear = speed < 20 ? speed / 20 : speed < 45 ? (speed - 20) / 25 : (speed - 45) / 45;
    const rpm = 34 + gear * 46 + speed * .45 + (throttle ? 10 : 0);
    this.engine.frequency.setTargetAtTime(rpm, t, .08); this.engineSub.frequency.setTargetAtTime(rpm / 2, t, .08);
    this.filter.frequency.setTargetAtTime(300 + speed * 9 + (throttle ? 350 : 0), t, .1);
    this.engineGain.gain.setTargetAtTime(running ? .09 + (throttle ? .05 : 0) : 0, t, .15);
  }
  private blip(frequency: number, duration: number, level: number, type: OscillatorType = "square", delay = 0) {
    const ctx = this.ctx; if (!ctx || !this.master || ctx.state !== "running") return;
    const t = ctx.currentTime + delay, osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = type; osc.frequency.value = frequency;
    gain.gain.setValueAtTime(level, t); gain.gain.exponentialRampToValueAtTime(.0001, t + duration);
    osc.connect(gain); gain.connect(this.master); osc.start(t); osc.stop(t + duration + .02);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
  tick(on: boolean) { this.blip(on ? 1900 : 1500, .025, .12); }
  warn() { this.blip(880, .18, .12, "sine"); this.blip(660, .22, .12, "sine", .16); }
  horn() { this.blip(400, .35, .1, "sawtooth"); this.blip(500, .35, .08, "sawtooth"); }
  async close() {
    const ctx = this.ctx; this.ctx = null; this.engine = this.engineSub = null; this.filter = null; this.engineGain = this.master = null;
    if (ctx && ctx.state !== "closed") await ctx.close();
  }
}

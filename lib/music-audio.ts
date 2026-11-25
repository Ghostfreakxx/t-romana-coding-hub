export const DRUM_KINDS = ["Kick", "Snare", "Hi-hat", "Clap", "Open hat", "Tom"] as const;

export class MusicAudio {
  private context: BaseAudioContext | null = null;
  private offline = false;
  /** Renders into an OfflineAudioContext (for exporting audio) instead of the speakers. */
  static offlineFor(ctx: OfflineAudioContext, volume = .55) { const a = new MusicAudio(); a.context = ctx; a.offline = true; a.volume = volume; return a; }
  private noise: AudioBuffer | null = null;
  volume = 0.55;
  async enable() { this.context ??= new AudioContext(); if (this.context.state === "suspended" && this.context instanceof AudioContext) await this.context.resume(); }
  /** Audio-clock time in seconds, for scheduling ahead of playback. */
  get time() { return this.context?.currentTime ?? 0; }
  private get live() { const ctx = this.context; return ctx && (this.offline || ctx.state === "running") && this.volume > 0 ? ctx : null; }
  private out(ctx: BaseAudioContext, nodes: AudioNode[], source: AudioScheduledSourceNode) {
    nodes.reduce((a, b) => { a.connect(b); return b; }).connect(ctx.destination);
    source.onended = () => nodes.forEach(n => n.disconnect());
  }
  tone(frequency: number, duration = 1.5, type: OscillatorType = "triangle", when?: number) {
    const ctx = this.live; if (!ctx) return;
    const t = when ?? ctx.currentTime, oscillator = ctx.createOscillator(), gain = ctx.createGain();
    oscillator.type = type; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(this.volume * .16, t + .008); gain.gain.exponentialRampToValueAtTime(.0001, t + duration);
    this.out(ctx, [oscillator, gain], oscillator); oscillator.start(t); oscillator.stop(t + duration + .02);
  }
  /** A brighter, piano-like note: fundamental plus soft overtones that fade faster than the body of the note. */
  piano(frequency: number, when?: number, duration = 1.8) {
    const ctx = this.live; if (!ctx) return;
    const t = when ?? ctx.currentTime, filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    filter.type = "lowpass"; filter.frequency.setValueAtTime(Math.min(9000, frequency * 9), t); filter.frequency.exponentialRampToValueAtTime(Math.max(400, frequency * 2), t + duration * .6);
    gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(this.volume * .2, t + .005); gain.gain.exponentialRampToValueAtTime(this.volume * .06, t + .25); gain.gain.exponentialRampToValueAtTime(.0001, t + duration);
    filter.connect(gain); gain.connect(ctx.destination);
    const partials: [number, OscillatorType, number][] = [[1, "triangle", 1], [2, "sine", .35], [3, "sine", .12]];
    let remaining = partials.length;
    for (const [mult, type, level] of partials) {
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = type; osc.frequency.value = frequency * mult; osc.detune.value = mult === 1 ? 0 : 3; g.gain.value = level;
      osc.connect(g); g.connect(filter); osc.start(t); osc.stop(t + duration + .02);
      osc.onended = () => { osc.disconnect(); g.disconnect(); if (--remaining === 0) { filter.disconnect(); gain.disconnect(); } };
    }
  }
  /** A round bass note: sawtooth through a closing low-pass filter. */
  bass(frequency: number, when?: number, duration = .42) {
    const ctx = this.live; if (!ctx) return;
    const t = when ?? ctx.currentTime, osc = ctx.createOscillator(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    osc.type = "sawtooth"; osc.frequency.value = frequency;
    filter.type = "lowpass"; filter.Q.value = 4; filter.frequency.setValueAtTime(900, t); filter.frequency.exponentialRampToValueAtTime(180, t + duration);
    gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(this.volume * .32, t + .01); gain.gain.exponentialRampToValueAtTime(.0001, t + duration);
    this.out(ctx, [osc, filter, gain], osc); osc.start(t); osc.stop(t + duration + .02);
  }
  private noiseBuffer(ctx: BaseAudioContext) {
    if (!this.noise || this.noise.sampleRate !== ctx.sampleRate) {
      this.noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * .5), ctx.sampleRate);
      const data = this.noise.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    return this.noise;
  }
  drum(kind: string, when?: number, level = 1) {
    const ctx = this.live; if (!ctx) return;
    const t = when ?? ctx.currentTime, v = this.volume * level;
    if (kind === "Kick" || kind === "Tom") {
      const osc = ctx.createOscillator(), gain = ctx.createGain(), [from, to, len] = kind === "Kick" ? [150, 45, .35] : [210, 110, .32];
      osc.frequency.setValueAtTime(from, t); osc.frequency.exponentialRampToValueAtTime(to, t + len * .6);
      gain.gain.setValueAtTime(v * (kind === "Kick" ? .6 : .4), t); gain.gain.exponentialRampToValueAtTime(.0001, t + len);
      this.out(ctx, [osc, gain], osc); osc.start(t); osc.stop(t + len + .01); return;
    }
    const duration = kind === "Hi-hat" ? .09 : kind === "Open hat" ? .38 : .23;
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    source.buffer = this.noiseBuffer(ctx); filter.type = "highpass"; filter.frequency.value = kind === "Hi-hat" ? 7000 : kind === "Open hat" ? 6000 : kind === "Clap" ? 1800 : 900;
    gain.gain.setValueAtTime(v * (kind === "Open hat" ? .22 : .35), t);
    // A clap is several hands a few milliseconds apart: re-trigger the level twice before the decay.
    if (kind === "Clap") { gain.gain.setValueAtTime(v * .08, t + .01); gain.gain.setValueAtTime(v * .35, t + .012); gain.gain.setValueAtTime(v * .08, t + .022); gain.gain.setValueAtTime(v * .3, t + .024); }
    gain.gain.exponentialRampToValueAtTime(.0001, t + duration);
    this.out(ctx, [source, filter, gain], source); source.start(t, Math.random() * .1, duration + .02);
    if (kind === "Snare") this.tone(185, .12, "sine", t);
  }
  async close() { const ctx = this.context; this.context = null; if (ctx instanceof AudioContext && ctx.state !== "closed") await ctx.close(); }
}

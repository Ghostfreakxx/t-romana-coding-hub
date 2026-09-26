export class MusicAudio {
  private context: AudioContext | null = null;
  volume = 0.55;
  async enable() { this.context ??= new AudioContext(); if (this.context.state === "suspended") await this.context.resume(); }
  tone(frequency: number, duration = 1.5, type: OscillatorType = "triangle", when?: number) {
    const ctx=this.context; if(!ctx || ctx.state!=="running" || this.volume<=0)return;
    const t=when??ctx.currentTime, oscillator=ctx.createOscillator(), gain=ctx.createGain();
    oscillator.type=type;oscillator.frequency.value=frequency;
    gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(this.volume*.16,t+.008);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start(t);oscillator.stop(t+duration+.02);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  }
  drum(kind:string) {
    const ctx=this.context;if(!ctx || ctx.state!=="running" || this.volume<=0)return;const t=ctx.currentTime;
    if(kind==="Kick"){const osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.setValueAtTime(150,t);osc.frequency.exponentialRampToValueAtTime(45,t+.2);gain.gain.setValueAtTime(this.volume*.6,t);gain.gain.exponentialRampToValueAtTime(.0001,t+.35);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(t+.36);osc.onended=()=>{osc.disconnect();gain.disconnect();};return;}
    const duration=kind==="Hi-hat"?.09:.23,buffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*duration),ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
    const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;filter.type="highpass";filter.frequency.value=kind==="Hi-hat"?7000:kind==="Clap"?1800:900;gain.gain.setValueAtTime(this.volume*.35,t);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);source.connect(filter);filter.connect(gain);gain.connect(ctx.destination);source.start();source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
    if(kind==="Snare")this.tone(185,.12,"sine");
  }
  async close(){const ctx=this.context;this.context=null;if(ctx&&ctx.state!=="closed")await ctx.close();}
}

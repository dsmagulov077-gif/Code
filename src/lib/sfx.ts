// Procedural sound effects via the Web Audio API — no audio files.
// A single lazily-created AudioContext; resume() must run after a user gesture.

type OscType = OscillatorType;

class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  enabled = true;
  private last: Record<string, number> = {};

  init() {
    if (this.ctx) return;
    const AC: typeof AudioContext =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.32;
    this.master.connect(this.ctx.destination);
  }

  resume() { this.ctx?.resume(); }

  setEnabled(v: boolean) {
    this.enabled = v;
    if (this.master) this.master.gain.value = v ? 0.32 : 0;
  }

  private now() { return this.ctx ? this.ctx.currentTime : 0; }

  // pitched blip with an optional frequency glide and a percussive envelope
  private blip(o: { f0: number; f1?: number; dur: number; type?: OscType; vol?: number; attack?: number; delay?: number }) {
    if (!this.ctx || !this.master || !this.enabled) return;
    const t = this.now() + (o.delay ?? 0);
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = o.type ?? 'square';
    osc.frequency.setValueAtTime(o.f0, t);
    if (o.f1 !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f1), t + o.dur);
    const vol = o.vol ?? 0.3, atk = o.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    osc.connect(g); g.connect(this.master);
    osc.start(t); osc.stop(t + o.dur + 0.02);
  }

  // filtered noise burst — swooshes, impacts, breaks
  private noise(o: { dur: number; vol?: number; type?: BiquadFilterType; freq?: number; sweep?: number; q?: number; delay?: number }) {
    if (!this.ctx || !this.master || !this.enabled) return;
    const t = this.now() + (o.delay ?? 0);
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * o.dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = o.type ?? 'bandpass';
    filt.frequency.setValueAtTime(o.freq ?? 1000, t);
    if (o.sweep) filt.frequency.exponentialRampToValueAtTime(Math.max(60, o.sweep), t + o.dur);
    filt.Q.value = o.q ?? 1;
    const g = this.ctx.createGain();
    const vol = o.vol ?? 0.3;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(filt); filt.connect(g); g.connect(this.master);
    src.start(t); src.stop(t + o.dur + 0.02);
  }

  // basic rate-limit so per-frame collisions don't stack into a buzz
  private throttle(name: string, ms: number) {
    const n = this.now() * 1000;
    if (this.last[name] && n - this.last[name] < ms) return false;
    this.last[name] = n;
    return true;
  }

  play(name: string) {
    if (!this.ctx || !this.enabled) return;
    switch (name) {
      case 'jump':
        this.blip({ f0: 280, f1: 560, dur: 0.16, type: 'square', vol: 0.22 });
        break;
      case 'djump':
        this.blip({ f0: 420, f1: 760, dur: 0.14, type: 'triangle', vol: 0.2 });
        break;
      case 'walljump':
        this.blip({ f0: 320, f1: 600, dur: 0.13, type: 'square', vol: 0.2 });
        this.noise({ dur: 0.12, freq: 1800, sweep: 700, vol: 0.12 });
        break;
      case 'dash':
        this.noise({ dur: 0.22, freq: 2400, sweep: 500, vol: 0.22, q: 0.7 });
        break;
      case 'attack':
        if (!this.throttle('attack', 70)) return;
        this.noise({ dur: 0.13, freq: 3200, sweep: 900, vol: 0.18, q: 0.8 });
        break;
      case 'hit':
        if (!this.throttle('hit', 40)) return;
        this.blip({ f0: 520, f1: 220, dur: 0.1, type: 'square', vol: 0.18 });
        this.noise({ dur: 0.06, freq: 1600, vol: 0.12 });
        break;
      case 'bosshit':
        if (!this.throttle('bosshit', 50)) return;
        this.blip({ f0: 180, f1: 90, dur: 0.14, type: 'sawtooth', vol: 0.2 });
        break;
      case 'enemydeath':
        this.blip({ f0: 300, f1: 70, dur: 0.3, type: 'sawtooth', vol: 0.2 });
        this.noise({ dur: 0.25, freq: 900, sweep: 200, vol: 0.16 });
        break;
      case 'hurt':
        this.blip({ f0: 200, f1: 110, dur: 0.28, type: 'square', vol: 0.26 });
        this.noise({ dur: 0.18, freq: 700, sweep: 200, vol: 0.14 });
        break;
      case 'block': {
        if (!this.throttle('block', 60)) return;
        // metallic clink — two inharmonic high partials
        this.blip({ f0: 2100, dur: 0.09, type: 'square', vol: 0.14 });
        this.blip({ f0: 3000, dur: 0.07, type: 'square', vol: 0.1 });
        this.noise({ dur: 0.05, freq: 5000, vol: 0.1, type: 'highpass' });
        break;
      }
      case 'shieldbreak':
        this.noise({ dur: 0.35, freq: 3000, sweep: 300, vol: 0.24, q: 0.6 });
        this.blip({ f0: 900, f1: 150, dur: 0.3, type: 'square', vol: 0.16 });
        break;
      case 'checkpoint':
        this.blip({ f0: 523, dur: 0.18, type: 'triangle', vol: 0.2 });
        this.blip({ f0: 784, dur: 0.28, type: 'triangle', vol: 0.2, delay: 0.12 });
        break;
      case 'buy':
        this.blip({ f0: 660, dur: 0.1, type: 'square', vol: 0.18 });
        this.blip({ f0: 990, dur: 0.16, type: 'square', vol: 0.18, delay: 0.08 });
        break;
      case 'projectile':
        if (!this.throttle('projectile', 80)) return;
        this.blip({ f0: 700, f1: 300, dur: 0.18, type: 'sawtooth', vol: 0.12 });
        break;
      case 'death':
        this.blip({ f0: 330, f1: 60, dur: 0.9, type: 'sawtooth', vol: 0.28 });
        this.noise({ dur: 0.8, freq: 600, sweep: 120, vol: 0.18 });
        break;
      case 'win':
        [523, 659, 784, 1047].forEach((f, i) =>
          this.blip({ f0: f, dur: 0.3, type: 'triangle', vol: 0.2, delay: i * 0.13 }));
        break;

      // movement feedback
      case 'land':
        if (!this.throttle('land', 90)) return;
        this.blip({ f0: 150, f1: 70, dur: 0.12, type: 'sine', vol: 0.16 });
        this.noise({ dur: 0.07, freq: 500, sweep: 200, vol: 0.1 });
        break;
      case 'step':
        if (!this.throttle('step', 200)) return;
        this.noise({ dur: 0.04, freq: 900, vol: 0.05 });
        break;

      // enemy "voices" — each kind sounds distinct
      case 'growl':   // crawler spots you
        if (!this.throttle('growl', 130)) return;
        this.blip({ f0: 160, f1: 90, dur: 0.22, type: 'sawtooth', vol: 0.15 });
        break;
      case 'screech': // flyer dives
        if (!this.throttle('screech', 130)) return;
        this.blip({ f0: 1500, f1: 600, dur: 0.18, type: 'sawtooth', vol: 0.12 });
        break;
      case 'hop':     // jumper leaps
        if (!this.throttle('hop', 90)) return;
        this.blip({ f0: 300, f1: 520, dur: 0.1, type: 'square', vol: 0.13 });
        break;

      // boss
      case 'bosslaunch':
        this.blip({ f0: 90, f1: 170, dur: 0.2, type: 'sawtooth', vol: 0.18 });
        break;
      case 'slam':
        this.blip({ f0: 120, f1: 45, dur: 0.35, type: 'sawtooth', vol: 0.3 });
        this.noise({ dur: 0.3, freq: 420, sweep: 90, vol: 0.26 });
        break;
      case 'bossroar':
        this.blip({ f0: 200, f1: 70, dur: 0.6, type: 'sawtooth', vol: 0.3 });
        this.blip({ f0: 130, f1: 55, dur: 0.7, type: 'square', vol: 0.22 });
        this.noise({ dur: 0.5, freq: 600, sweep: 150, vol: 0.16 });
        break;
      case 'bossintro':
        this.blip({ f0: 60, f1: 150, dur: 0.7, type: 'sawtooth', vol: 0.26 });
        this.noise({ dur: 0.6, freq: 300, sweep: 1200, vol: 0.14 });
        break;

      // enemy / boss attack contact + ambience
      case 'bite':   // crawler / jumper claw the player
        if (!this.throttle('bite', 140)) return;
        this.noise({ dur: 0.07, freq: 2600, sweep: 800, vol: 0.16, q: 0.9 });
        this.blip({ f0: 240, f1: 120, dur: 0.09, type: 'square', vol: 0.14 });
        break;
      case 'peck':   // flyer strikes
        if (!this.throttle('peck', 140)) return;
        this.blip({ f0: 1100, f1: 500, dur: 0.08, type: 'square', vol: 0.12 });
        this.noise({ dur: 0.05, freq: 3500, vol: 0.1 });
        break;
      case 'bossattack': // boss body-slams into the player
        if (!this.throttle('bossattack', 200)) return;
        this.blip({ f0: 150, f1: 60, dur: 0.18, type: 'sawtooth', vol: 0.24 });
        this.noise({ dur: 0.14, freq: 700, sweep: 200, vol: 0.18 });
        break;
      case 'bossstep':   // heavy footfall while the boss walks
        if (!this.throttle('bossstep', 240)) return;
        this.blip({ f0: 90, f1: 50, dur: 0.13, type: 'sine', vol: 0.2 });
        this.noise({ dur: 0.08, freq: 320, sweep: 110, vol: 0.13 });
        break;
      case 'flap':   // flyer wingbeat
        if (!this.throttle('flap', 230)) return;
        this.noise({ dur: 0.12, freq: 600, sweep: 1400, vol: 0.07, q: 0.6 });
        break;
      case 'lasercharge':  // boss core winding up the beam
        this.blip({ f0: 180, f1: 1050, dur: 0.8, type: 'sawtooth', vol: 0.16 });
        this.blip({ f0: 90,  f1: 520,  dur: 0.8, type: 'sine', vol: 0.12 });
        break;
      case 'laserfire':    // the beam discharges
        this.noise({ dur: 0.6, freq: 1900, sweep: 500, vol: 0.22, q: 1.6 });
        this.blip({ f0: 1300, f1: 360, dur: 0.6, type: 'sawtooth', vol: 0.16 });
        break;
    }
  }
}

export const sfx = new Sfx();

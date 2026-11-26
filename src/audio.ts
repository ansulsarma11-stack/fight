/**
 * Arena Clash - Web Audio API Sound Synthesizer
 * 100% self-contained audio synthesis with zero external dependencies.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public volume: number = 0.5;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Master output node helper
  private getMaster(time: number, duration: number): GainNode | null {
    if (!this.enabled) return null;
    this.initCtx();
    if (!this.ctx) return null;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume, time);
    gain.connect(this.ctx.destination);
    return gain;
  }

  /**
   * Round Bell: 3 crisp brassy rings ("DING DING DING")
   */
  public playRoundBell() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [0, 0.28, 0.56].forEach((delay) => {
      const strikeTime = now + delay;
      // High bell fundamental + harmonics
      [880, 1760, 2640].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, strikeTime);

        const vol = (0.35 / (idx + 1)) * this.volume;
        gain.gain.setValueAtTime(vol, strikeTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, strikeTime + 0.8);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(strikeTime);
        osc.stop(strikeTime + 0.85);
      });
    });
  }

  /**
   * Punch sound: snappy attack transient + punchy low body
   */
  public playPunch() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

    gain.gain.setValueAtTime(0.6 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    // Add noise click for impact snap
    this.playNoiseSnap(now, 0.04, 0.4 * this.volume);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Kick sound: heavier low-end punch + wind whoosh
   */
  public playKick() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.22);

    gain.gain.setValueAtTime(0.8 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    // Heavier mid-crunch
    this.playNoiseSnap(now, 0.08, 0.5 * this.volume);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Whoosh sound (swinging a punch/kick or jumping)
   */
  public playWhoosh() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.16;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.16);
    filter.Q.value = 3.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25 * this.volume, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.17);
  }

  /**
   * Block Clank: high metallic clang with rapid decay
   */
  public playBlock() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [1250, 2400, 3100].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx === 0 ? 'triangle' : 'square';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.8, now + 0.18);

      const amp = (0.35 / (idx + 1)) * this.volume;
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    });
  }

  /**
   * Special Move Charge: rising sci-fi power surge
   */
  public playSpecialCharge() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);

    gain.gain.setValueAtTime(0.1 * this.volume, now);
    gain.gain.linearRampToValueAtTime(0.5 * this.volume, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.42);
  }

  /**
   * Special Move Blast: Thunderous boom and blast roar
   */
  public playSpecialBlast() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Sub rumble
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(120, now);
    subOsc.frequency.exponentialRampToValueAtTime(28, now + 0.6);

    subGain.gain.setValueAtTime(0.85 * this.volume, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.7);

    // Roaring noise explosion
    this.playNoiseSnap(now, 0.45, 0.6 * this.volume, 600);
  }

  /**
   * Knockout Slowmo Thud
   */
  public playKnockout() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 1.2);

    gain.gain.setValueAtTime(0.9 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.25);

    // Trigger crowd cheer shortly after
    setTimeout(() => {
      this.playCrowdCheer();
    }, 400);
  }

  /**
   * Stadium crowd cheer roar
   */
  public playCrowdCheer() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 2.4;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.7;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(1200, now + 1.0);
    filter.frequency.exponentialRampToValueAtTime(600, now + duration);
    filter.Q.value = 1.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35 * this.volume, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + duration + 0.1);
  }

  /**
   * Victory Fanfare Arpeggio
   */
  public playVictoryFanfare() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.5]; // A major triumphant chord
    const now = this.ctx.currentTime;

    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const noteTime = now + i * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.2 * this.volume, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.55);
    });
  }

  /**
   * Helper for noise burst impacts
   */
  private playNoiseSnap(time: number, duration: number, volume: number, cutoff = 1500) {
    if (!this.ctx) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(time);
    noise.stop(time + duration + 0.05);
  }
}

export const soundEngine = new SoundEngine();

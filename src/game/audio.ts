/**
 * Procedural Web Audio Engine for Turbo Rush
 * Generates dynamic engine sounds, tire skids, nitro roar, coin chimes,
 * countdown beeps, fanfare, and arcade synthwave music with zero external audio assets.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private soundVolume: number = 0.8;
  private musicVolume: number = 0.5;

  // Engine Audio Nodes
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning: boolean = false;

  // Drift Skid Nodes
  private skidSource: AudioBufferSourceNode | null = null;
  private skidGain: GainNode | null = null;
  private isSkidding: boolean = false;

  // Nitro Nodes
  private nitroGain: GainNode | null = null;
  private isNitroPlaying: boolean = false;

  // Music loop state
  private isMusicPlaying: boolean = false;
  private musicInterval: any = null;
  private currentStep: number = 0;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(soundVol: number, musicVol: number) {
    this.soundVolume = Math.max(0, Math.min(1, soundVol));
    this.musicVolume = Math.max(0, Math.min(1, musicVol));
    if (this.engineGain) {
      this.engineGain.gain.setValueAtTime(this.soundVolume * 0.18, this.ctx?.currentTime || 0);
    }
  }

  // --- ENGINE SYNTHESIS ---
  public startEngine() {
    this.init();
    if (!this.ctx || this.isEngineRunning) return;

    try {
      // Create multi-oscillator low-frequency engine rumble
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineGain = this.ctx.createGain();

      this.engineOsc1.type = 'sawtooth';
      this.engineOsc2.type = 'triangle';

      this.engineOsc1.frequency.setValueAtTime(45, this.ctx.currentTime);
      this.engineOsc2.frequency.setValueAtTime(90, this.ctx.currentTime);

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(3, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(this.soundVolume * 0.15, this.ctx.currentTime);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc1.start();
      this.engineOsc2.start();
      this.isEngineRunning = true;
    } catch (e) {
      console.warn('Audio engine error:', e);
    }
  }

  public updateEngine(speedKmh: number, isAccelerating: boolean, isNitro: boolean) {
    if (!this.ctx || !this.isEngineRunning || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter) return;

    const baseRpm = 45;
    const speedRatio = Math.min(speedKmh / 320, 1.2);
    const accelBoost = isAccelerating ? 25 : 0;
    const nitroBoost = isNitro ? 50 : 0;

    // Simulated gear shift pitch curve
    const gearProgress = (speedRatio * 5) % 1;
    const targetFreq = baseRpm + (gearProgress * 120) + (speedRatio * 80) + accelBoost + nitroBoost;
    const filterFreq = 300 + (speedRatio * 1800) + (isAccelerating ? 400 : 0) + (isNitro ? 800 : 0);

    const now = this.ctx.currentTime;
    this.engineOsc1.frequency.setTargetAtTime(targetFreq, now, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(targetFreq * 1.5, now, 0.08);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.08);

    if (this.engineGain) {
      const targetGain = this.soundVolume * (0.12 + (speedRatio * 0.1) + (isAccelerating ? 0.05 : 0));
      this.engineGain.gain.setTargetAtTime(targetGain, now, 0.08);
    }
  }

  public stopEngine() {
    if (!this.isEngineRunning) return;
    try {
      if (this.engineOsc1) {
        this.engineOsc1.stop();
        this.engineOsc1.disconnect();
      }
      if (this.engineOsc2) {
        this.engineOsc2.stop();
        this.engineOsc2.disconnect();
      }
      this.engineOsc1 = null;
      this.engineOsc2 = null;
      this.isEngineRunning = false;
    } catch (e) {
      // Ignore
    }
  }

  // --- DRIFT SKID SOUND ---
  public startSkid() {
    this.init();
    if (!this.ctx || this.isSkidding || this.soundVolume <= 0) return;

    try {
      const bufferSize = this.ctx.sampleRate * 1.0;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      this.skidSource = this.ctx.createBufferSource();
      this.skidSource.buffer = buffer;
      this.skidSource.loop = true;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1400, this.ctx.currentTime);
      bandpass.Q.setValueAtTime(4.0, this.ctx.currentTime);

      this.skidGain = this.ctx.createGain();
      this.skidGain.gain.setValueAtTime(this.soundVolume * 0.22, this.ctx.currentTime);

      this.skidSource.connect(bandpass);
      bandpass.connect(this.skidGain);
      this.skidGain.connect(this.ctx.destination);

      this.skidSource.start();
      this.isSkidding = true;
    } catch (e) {
      // Ignore
    }
  }

  public stopSkid() {
    if (!this.isSkidding || !this.skidSource) return;
    try {
      if (this.skidGain && this.ctx) {
        this.skidGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
      setTimeout(() => {
        if (this.skidSource) {
          try {
            this.skidSource.stop();
            this.skidSource.disconnect();
          } catch (e) {}
          this.skidSource = null;
        }
        this.isSkidding = false;
      }, 60);
    } catch (e) {
      this.isSkidding = false;
    }
  }

  // --- NITRO SOUND ---
  public playNitroWhoosh() {
    this.init();
    if (!this.ctx || this.soundVolume <= 0) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.35);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + 0.35);
      filter.Q.setValueAtTime(2.0, now);

      gain.gain.setValueAtTime(this.soundVolume * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    } catch (e) {}
  }

  // --- COIN PICKUP SOUND ---
  public playCoinSound() {
    this.init();
    if (!this.ctx || this.soundVolume <= 0) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      // 2-tone bright arcade chime (B5 -> E6)
      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      osc2.frequency.setValueAtTime(1975.53, now); // B6
      osc2.frequency.setValueAtTime(2637.02, now + 0.08); // E7

      gain.gain.setValueAtTime(this.soundVolume * 0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.38);
      osc2.stop(now + 0.38);
    } catch (e) {}
  }

  // --- SPEED BOOST PAD SOUND ---
  public playBoostPadSound() {
    this.init();
    if (!this.ctx || this.soundVolume <= 0) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

      gain.gain.setValueAtTime(this.soundVolume * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {}
  }

  // --- COLLISION THUD ---
  public playCollisionSound() {
    this.init();
    if (!this.ctx || this.soundVolume <= 0) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);

      gain.gain.setValueAtTime(this.soundVolume * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.23);
    } catch (e) {}
  }

  // --- COUNTDOWN SOUNDS ---
  public playCountdownBeep(isGo: boolean) {
    this.init();
    if (!this.ctx || this.soundVolume <= 0) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isGo ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(isGo ? 880 : 440, now);
      if (isGo) {
        osc.frequency.setValueAtTime(1174.66, now + 0.08); // High D6
      }

      gain.gain.setValueAtTime(this.soundVolume * (isGo ? 0.45 : 0.35), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.6 : 0.28));

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + (isGo ? 0.65 : 0.3));
    } catch (e) {}
  }

  // --- VICTORY FANFARE ---
  public playVictoryFanfare() {
    this.init();
    if (!this.ctx || this.soundVolume <= 0) return;

    const notes = [
      { f: 523.25, d: 0.15 }, // C5
      { f: 659.25, d: 0.15 }, // E5
      { f: 783.99, d: 0.15 }, // G5
      { f: 1046.50, d: 0.45 }, // C6
    ];

    let delay = 0;
    notes.forEach((note) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, now);

        gain.gain.setValueAtTime(this.soundVolume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + note.d);
      }, delay * 1000);
      delay += note.d + 0.05;
    });
  }

  // --- BUTTON CLICK SOUND ---
  public playClick() {
    this.init();
    if (!this.ctx || this.soundVolume <= 0) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.06);
      gain.gain.setValueAtTime(this.soundVolume * 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {}
  }

  // --- SYNTHWAVE RACING MUSIC ENGINE ---
  public startMusic() {
    this.init();
    if (this.isMusicPlaying || !this.ctx || this.musicVolume <= 0) return;

    this.isMusicPlaying = true;
    this.currentStep = 0;

    // 130 BPM = ~115ms per 16th note
    const stepTime = 115;
    const bassScale = [110, 110, 130.81, 146.83, 164.81, 146.83, 130.81, 98]; // A2, C3, D3, E3...
    const leadScale = [440, 523.25, 659.25, 587.33, 659.25, 783.99, 659.25, 523.25];

    this.musicInterval = setInterval(() => {
      if (!this.ctx || !this.isMusicPlaying || this.musicVolume <= 0) return;
      const now = this.ctx.currentTime;
      const step = this.currentStep % 16;

      // Bass Kick on 0, 4, 8, 12
      if (step % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(150, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
        kickGain.gain.setValueAtTime(this.musicVolume * 0.35, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        kickOsc.connect(kickGain);
        kickGain.connect(this.ctx.destination);
        kickOsc.start(now);
        kickOsc.stop(now + 0.13);
      }

      // Synth Bass Arpeggio on every 16th note
      const bassFreq = bassScale[(this.currentStep >> 1) % bassScale.length];
      if (step % 2 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassFilter = this.ctx.createBiquadFilter();
        const bassGain = this.ctx.createGain();

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassFreq * 0.5, now);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(450, now);
        bassFilter.Q.setValueAtTime(4, now);

        bassGain.gain.setValueAtTime(this.musicVolume * 0.15, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.ctx.destination);

        bassOsc.start(now);
        bassOsc.stop(now + 0.11);
      }

      // Synth Lead Melody on selected beats
      if (step % 4 === 2 || step === 14) {
        const leadFreq = leadScale[this.currentStep % leadScale.length];
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();

        leadOsc.type = 'square';
        leadOsc.frequency.setValueAtTime(leadFreq, now);

        leadGain.gain.setValueAtTime(this.musicVolume * 0.09, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        leadOsc.connect(leadGain);
        leadGain.connect(this.ctx.destination);

        leadOsc.start(now);
        leadOsc.stop(now + 0.22);
      }

      this.currentStep++;
    }, stepTime);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const soundManager = new SoundEngine();

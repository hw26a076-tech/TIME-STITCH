class TimeStitchAudio {
  private ctx: AudioContext | null = null;
  private masterVolume: GainNode | null = null;
  private musicVolume: GainNode | null = null;
  private sfxVolume: GainNode | null = null;
  private musicInterval: any = null;
  private mVolumeVal: number = 0.6;
  private sVolumeVal: number = 0.7;
  private isMusicPlaying: boolean = false;
  private currentSeqStep: number = 0;

  constructor() {
    // AudioContext is initialized lazily upon first interaction
  }

  private init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      
      this.masterVolume = this.ctx.createGain();
      this.masterVolume.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterVolume.connect(this.ctx.destination);

      this.musicVolume = this.ctx.createGain();
      this.musicVolume.gain.setValueAtTime(this.mVolumeVal, this.ctx.currentTime);
      this.musicVolume.connect(this.masterVolume);

      this.sfxVolume = this.ctx.createGain();
      this.sfxVolume.gain.setValueAtTime(this.sVolumeVal, this.ctx.currentTime);
      this.sfxVolume.connect(this.masterVolume);
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  setMasterVolume(val: number) {
    this.init();
    if (this.masterVolume && this.ctx) {
      this.masterVolume.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }
  }

  setMusicVolume(val: number) {
    this.mVolumeVal = val;
    this.init();
    if (this.musicVolume && this.ctx) {
      this.musicVolume.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }
  }

  setSfxVolume(val: number) {
    this.sVolumeVal = val;
    this.init();
    if (this.sfxVolume && this.ctx) {
      this.sfxVolume.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }
  }

  playJump() {
    this.init();
    if (!this.ctx || !this.sfxVolume) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.15);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxVolume);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  playStitchConnect() {
    this.init();
    if (!this.ctx || !this.sfxVolume) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;
    // Layer 1: High frequency tick/spark
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(520, t);
    osc1.frequency.linearRampToValueAtTime(880, t + 0.12);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(260, t);
    osc2.frequency.linearRampToValueAtTime(440, t + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.Q.setValueAtTime(5, t);

    gain.gain.setValueAtTime(0.0, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.005, t + 0.2);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxVolume);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.22);
    osc2.stop(t + 0.22);
  }

  playCatapult() {
    this.init();
    if (!this.ctx || !this.sfxVolume) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const sweepOsc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.4);

    sweepOsc.type = 'sine';
    sweepOsc.frequency.setValueAtTime(90, t);
    sweepOsc.frequency.exponentialRampToValueAtTime(450, t + 0.3);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, t);
    filter.frequency.exponentialRampToValueAtTime(3000, t + 0.35);
    filter.Q.setValueAtTime(6, t);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);

    osc.connect(filter);
    sweepOsc.connect(gain);
    filter.connect(gain);
    gain.connect(this.sfxVolume);

    osc.start(t);
    sweepOsc.start(t);
    osc.stop(t + 0.45);
    sweepOsc.stop(t + 0.45);
  }

  playCoreCollect() {
    this.init();
    if (!this.ctx || !this.sfxVolume) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);
      
      gain.gain.setValueAtTime(0, t + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.12, t + idx * 0.06 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxVolume!);

      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.3);
    });
  }

  playDeath() {
    this.init();
    if (!this.ctx || !this.sfxVolume) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const noiseGain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(80, t + 0.5);

    noiseGain.gain.setValueAtTime(0.3, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

    osc.connect(noiseGain);
    noiseGain.connect(this.sfxVolume);

    osc.start(t);
    osc.stop(t + 0.6);

    // Create a bit of white noise crash
    try {
      const bufferSize = this.ctx.sampleRate * 0.3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(800, t);
      noiseFilter.frequency.exponentialRampToValueAtTime(100, t + 0.3);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.12, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      noise.connect(noiseFilter);
      noiseFilter.connect(nGain);
      nGain.connect(this.sfxVolume);

      noise.start(t);
      noise.stop(t + 0.3);
    } catch (err) {
      // Fallback
    }
  }

  playStageClear() {
    this.init();
    if (!this.ctx || !this.sfxVolume) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;
    // Play a shiny pentatonic sci-fi chord resolution
    const chord = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major
    chord.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);
      
      gain.gain.setValueAtTime(0, t + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.08, t + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxVolume!);

      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.7);
    });
  }

  playRopeBreak() {
    this.init();
    if (!this.ctx || !this.sfxVolume) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(550, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.2);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxVolume);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  startMusic() {
    this.init();
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    // A futuristic synthwave / chiptune step sequencer
    let step = 0;
    // Chords progression (Fmaj7, G7, Am, Em in frequencies)
    const progression = [
      [174.61, 220.00, 261.63, 329.63], // F, A, C, E (Fmaj7)
      [196.00, 246.94, 293.66, 349.23], // G, B, D, F (G7)
      [220.00, 261.63, 329.63, 392.00], // A, C, E, G (Am7)
      [164.81, 196.00, 246.94, 329.63], // E, G, B, E (Em7)
    ];

    const playStep = () => {
      if (!this.ctx || !this.musicVolume) return;
      const t = this.ctx.currentTime;

      // Current chord based on every 16 steps
      const chordIndex = Math.floor(step / 8) % progression.length;
      const chord = progression[chordIndex];

      // Bassline on steps 0, 2, 4, 6...
      if (step % 2 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        // Use the root of the chord pitched down 2 octaves
        const rootFreq = chord[0] / 4;
        bassOsc.frequency.setValueAtTime(rootFreq, t);

        const bassFilter = this.ctx.createBiquadFilter();
        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(250, t);

        bassGain.gain.setValueAtTime(0.08, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.musicVolume);

        bassOsc.start(t);
        bassOsc.stop(t + 0.25);
      }

      // Synth pad or arpeggion on 16th notes
      if (step % 1 === 0) {
        // Pick a note from the chord
        const noteIdx = (step * 3) % chord.length;
        const noteFreq = chord[noteIdx] * (step % 4 === 3 ? 2 : 1); // sometimes drop up an octave

        const padOsc = this.ctx.createOscillator();
        const padGain = this.ctx.createGain();
        padOsc.type = 'triangle';
        padOsc.frequency.setValueAtTime(noteFreq, t);

        padGain.gain.setValueAtTime(0.03, t);
        padGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        padOsc.connect(padGain);
        padGain.connect(this.musicVolume);

        padOsc.start(t);
        padOsc.stop(t + 0.18);
      }

      // Cyber hat/noise sound on 4th steps
      if (step % 4 === 2) {
        const noiseOsc = this.ctx.createOscillator();
        const noiseGain = this.ctx.createGain();
        noiseOsc.type = 'triangle';
        noiseOsc.frequency.setValueAtTime(2000, t);

        noiseGain.gain.setValueAtTime(0.015, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        noiseOsc.connect(noiseGain);
        noiseGain.connect(this.musicVolume);

        noiseOsc.start(t);
        noiseOsc.stop(t + 0.06);
      }

      step = (step + 1) % 32;
    };

    const intervalTime = 160; // ms per step (approx 93 BPM)
    this.musicInterval = setInterval(playStep, intervalTime);
  }

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.isMusicPlaying = false;
  }
}

export const sfx = new TimeStitchAudio();

/**
 * Procedural Web Audio API Engine for Komorebi Ambient Studio.
 * 100% self-contained synthesized audio with zero external audio assets.
 */

import { SoundId, SoundChannelState, calculateChannelEffectiveGain } from '../utils/soundLogic';

class KomorebiAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private analyser: AnalyserNode | null = null;
  private reverbConvolver: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private dryGain: GainNode | null = null;

  private isInitialized = false;
  private isPlaying = false;

  // Active channel nodes
  private channelNodes = new Map<
    SoundId,
    {
      gainNode: GainNode;
      panNode: StereoPannerNode;
      stop?: () => void;
    }
  >();

  // Binaural state
  private binauralLeftOsc: OscillatorNode | null = null;
  private binauralRightOsc: OscillatorNode | null = null;
  private binauralLeftGain: GainNode | null = null;
  private binauralRightGain: GainNode | null = null;

  // Drone state
  private droneOscillators: OscillatorNode[] = [];
  private droneInterval: number | null = null;

  // Timers & interval handles
  private thunderTimeout: number | null = null;
  private chimesInterval: number | null = null;
  private campfireInterval: number | null = null;

  /**
   * Initialize AudioContext on first user interaction
   */
  public async init(): Promise<void> {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Analyser node for visualizer
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);

    // 3-Band Equalizer
    this.bassFilter = this.ctx.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.setValueAtTime(250, this.ctx.currentTime);
    this.bassFilter.gain.setValueAtTime(0, this.ctx.currentTime);

    this.midFilter = this.ctx.createBiquadFilter();
    this.midFilter.type = 'peaking';
    this.midFilter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    this.midFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);
    this.midFilter.gain.setValueAtTime(0, this.ctx.currentTime);

    this.trebleFilter = this.ctx.createBiquadFilter();
    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.setValueAtTime(4000, this.ctx.currentTime);
    this.trebleFilter.gain.setValueAtTime(0, this.ctx.currentTime);

    // Reverb simulation
    this.createSyntheticReverb();

    // Wiring EQ
    this.masterGain.connect(this.bassFilter);
    this.bassFilter.connect(this.midFilter);
    this.midFilter.connect(this.trebleFilter);

    // Wiring through Reverb & Dry mix to Analyser then Destination
    if (this.reverbConvolver && this.reverbGain && this.dryGain) {
      this.trebleFilter.connect(this.dryGain);
      this.trebleFilter.connect(this.reverbConvolver);
      this.reverbConvolver.connect(this.reverbGain);

      this.dryGain.connect(this.analyser);
      this.reverbGain.connect(this.analyser);
    } else {
      this.trebleFilter.connect(this.analyser);
    }

    this.analyser.connect(this.ctx.destination);
    this.isInitialized = true;
  }

  /**
   * Generates a lush algorithmic impulse response buffer for ambient reverb
   */
  private createSyntheticReverb(): void {
    if (!this.ctx) return;
    const rate = this.ctx.sampleRate;
    const length = rate * 2.8; // 2.8s decay
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const decay = Math.exp(-i / (rate * 0.9));
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }

    this.reverbConvolver = this.ctx.createConvolver();
    this.reverbConvolver.buffer = impulse;

    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
  }

  /**
   * Starts or resumes playback
   */
  public async play(): Promise<void> {
    await this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.isPlaying = true;
  }

  /**
   * Pauses master playback
   */
  public pause(): void {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
    this.isPlaying = false;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Sets Master Volume
   */
  public setMasterVolume(vol: number): void {
    if (!this.ctx || !this.masterGain) return;
    const safeVol = Math.max(0, Math.min(vol, 1));
    this.masterGain.gain.setTargetAtTime(safeVol, this.ctx.currentTime, 0.05);
  }

  /**
   * Sets Master EQ gains (-12dB to +12dB)
   */
  public setEQ(bassDb: number, midDb: number, trebleDb: number): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.bassFilter) this.bassFilter.gain.setTargetAtTime(bassDb, now, 0.05);
    if (this.midFilter) this.midFilter.gain.setTargetAtTime(midDb, now, 0.05);
    if (this.trebleFilter) this.trebleFilter.gain.setTargetAtTime(trebleDb, now, 0.05);
  }

  /**
   * Sets Reverb Wet amount (0.0 to 1.0)
   */
  public setReverbWet(amount: number): void {
    if (!this.ctx || !this.reverbGain || !this.dryGain) return;
    const wet = Math.max(0, Math.min(amount, 1));
    const now = this.ctx.currentTime;
    this.reverbGain.gain.setTargetAtTime(wet * 0.6, now, 0.05);
    this.dryGain.gain.setTargetAtTime(1 - (wet * 0.4), now, 0.05);
  }

  /**
   * Syncs all channel states with the synthesizer nodes
   */
  public syncChannels(
    channels: SoundChannelState[],
    masterVolume: number,
    masterMuted: boolean,
    binauralHz = 10
  ): void {
    if (!this.isInitialized || !this.ctx || !this.masterGain) return;

    const hasAnySolo = channels.some((c) => c.solo);

    channels.forEach((channel) => {
      const effectiveGain = calculateChannelEffectiveGain(channel, hasAnySolo, masterVolume, masterMuted);
      let nodeWrap = this.channelNodes.get(channel.id);

      if (!nodeWrap) {
        nodeWrap = this.setupChannelNode(channel.id, binauralHz);
        this.channelNodes.set(channel.id, nodeWrap);
      }

      // Smooth gain transition
      nodeWrap.gainNode.gain.setTargetAtTime(effectiveGain, this.ctx!.currentTime, 0.08);

      // Stereo pan
      if (nodeWrap.panNode && typeof nodeWrap.panNode.pan !== 'undefined') {
        const safePan = Math.max(-1, Math.min(channel.pan, 1));
        nodeWrap.panNode.pan.setTargetAtTime(safePan, this.ctx!.currentTime, 0.08);
      }
    });
  }

  /**
   * Update Binaural Target Frequency
   */
  public setBinauralHz(targetHz: number, baseCarrier = 216): void {
    if (!this.ctx || !this.binauralLeftOsc || !this.binauralRightOsc) return;
    const halfDiff = targetHz / 2;
    const now = this.ctx.currentTime;
    this.binauralLeftOsc.frequency.setTargetAtTime(baseCarrier - halfDiff, now, 0.1);
    this.binauralRightOsc.frequency.setTargetAtTime(baseCarrier + halfDiff, now, 0.1);
  }

  /**
   * Creates audio graph for specific sound channel
   */
  private setupChannelNode(
    id: SoundId,
    binauralHz = 10
  ): { gainNode: GainNode; panNode: StereoPannerNode; stop?: () => void } {
    if (!this.ctx || !this.masterGain) throw new Error('AudioContext not ready');

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, this.ctx.currentTime);

    const panNode = this.ctx.createStereoPanner();
    panNode.pan.setValueAtTime(0, this.ctx.currentTime);

    gainNode.connect(panNode);
    panNode.connect(this.masterGain);

    let stopFn: (() => void) | undefined;

    switch (id) {
      case 'rain':
        stopFn = this.buildRainSynthesizer(gainNode);
        break;
      case 'thunder':
        stopFn = this.buildThunderSynthesizer(gainNode);
        break;
      case 'ocean':
        stopFn = this.buildOceanSynthesizer(gainNode);
        break;
      case 'fire':
        stopFn = this.buildFireSynthesizer(gainNode);
        break;
      case 'crickets':
        stopFn = this.buildCricketsSynthesizer(gainNode);
        break;
      case 'birds':
        stopFn = this.buildChimesSynthesizer(gainNode);
        break;
      case 'wind':
        stopFn = this.buildWindSynthesizer(gainNode);
        break;
      case 'whitenoise':
        stopFn = this.buildNoiseSynthesizer('pink', gainNode);
        break;
      case 'brownnoise':
        stopFn = this.buildNoiseSynthesizer('brown', gainNode);
        break;
      case 'binaural':
        stopFn = this.buildBinauralSynthesizer(gainNode, binauralHz);
        break;
      case 'drone':
        stopFn = this.buildLoFiDroneSynthesizer(gainNode);
        break;
    }

    return { gainNode, panNode, stop: stopFn };
  }

  // --- SYNTHESIZERS ---

  private buildNoiseSynthesizer(type: 'white' | 'pink' | 'brown', destination: GainNode): () => void {
    if (!this.ctx) return () => {};
    const bufferSize = this.ctx.sampleRate * 4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'white') {
        output[i] = white * 0.3;
      } else if (type === 'pink') {
        // Paul Kellet's filtered pink noise algorithm
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      } else {
        // Brown noise: integrated white noise
        lastOut = (lastOut + (0.02 * white)) / 1.02;
        output[i] = lastOut * 2.8;
      }
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    whiteNoise.connect(destination);
    whiteNoise.start();

    return () => {
      try {
        whiteNoise.stop();
        whiteNoise.disconnect();
      } catch {
        // ignore
      }
    };
  }

  private buildRainSynthesizer(destination: GainNode): () => void {
    if (!this.ctx) return () => {};
    // Continuous soft pink noise + highpass + bandpass
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(320, this.ctx.currentTime);

    highpass.connect(filter);
    filter.connect(destination);

    const stopPink = this.buildNoiseSynthesizer('pink', highpass as unknown as GainNode);

    // Subtle random raindrop clicks
    const dropletInterval = window.setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const osc = this.ctx.createOscillator();
      const dropGain = this.ctx.createGain();
      const freq = 1200 + Math.random() * 3200;
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + 0.04);

      dropGain.gain.setValueAtTime(0.015 + Math.random() * 0.03, now);
      dropGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(dropGain);
      dropGain.connect(destination);

      osc.start(now);
      osc.stop(now + 0.05);
    }, 120);

    return () => {
      stopPink();
      window.clearInterval(dropletInterval);
    };
  }

  private buildOceanSynthesizer(destination: GainNode): () => void {
    if (!this.ctx) return () => {};
    const waveFilter = this.ctx.createBiquadFilter();
    waveFilter.type = 'lowpass';
    waveFilter.frequency.setValueAtTime(300, this.ctx.currentTime);
    waveFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    waveFilter.connect(destination);
    const stopBrown = this.buildNoiseSynthesizer('brown', waveFilter as unknown as GainNode);

    // LFO to sweep lowpass filter back and forth like ocean waves
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.09, this.ctx.currentTime); // ~11 second swell cycle

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(260, this.ctx.currentTime); // sweep between 40Hz and 560Hz

    lfo.connect(lfoGain);
    lfoGain.connect(waveFilter.frequency);
    lfo.start();

    return () => {
      stopBrown();
      try {
        lfo.stop();
        lfo.disconnect();
      } catch {
        // ignore
      }
    };
  }

  private buildFireSynthesizer(destination: GainNode): () => void {
    if (!this.ctx) return () => {};
    // Gentle low roar
    const roarFilter = this.ctx.createBiquadFilter();
    roarFilter.type = 'lowpass';
    roarFilter.frequency.setValueAtTime(350, this.ctx.currentTime);
    roarFilter.connect(destination);

    const stopBrown = this.buildNoiseSynthesizer('brown', roarFilter as unknown as GainNode);

    // Poisson crackle spikes
    this.campfireInterval = window.setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      if (Math.random() > 0.45) return; // random crackle probability

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const popGain = this.ctx.createGain();
      const crackleFilter = this.ctx.createBiquadFilter();

      crackleFilter.type = 'highpass';
      crackleFilter.frequency.setValueAtTime(1600 + Math.random() * 2000, now);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80 + Math.random() * 600, now);

      const amp = 0.08 + Math.random() * 0.15;
      popGain.gain.setValueAtTime(amp, now);
      popGain.gain.exponentialRampToValueAtTime(0.0001, now + (0.01 + Math.random() * 0.04));

      osc.connect(crackleFilter);
      crackleFilter.connect(popGain);
      popGain.connect(destination);

      osc.start(now);
      osc.stop(now + 0.05);
    }, 60);

    return () => {
      stopBrown();
      if (this.campfireInterval) window.clearInterval(this.campfireInterval);
    };
  }

  private buildCricketsSynthesizer(destination: GainNode): () => void {
    if (!this.ctx) return () => {};
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(4600, this.ctx.currentTime);

    // AM modulation for cicada / cricket pulse
    const amOsc = this.ctx.createOscillator();
    amOsc.type = 'sine';
    amOsc.frequency.setValueAtTime(14, this.ctx.currentTime);

    const amGain = this.ctx.createGain();
    amGain.gain.setValueAtTime(0.5, this.ctx.currentTime);

    const carrierGain = this.ctx.createGain();
    carrierGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    amOsc.connect(amGain);
    amGain.connect(carrierGain.gain);
    osc.connect(carrierGain);
    carrierGain.connect(destination);

    osc.start();
    amOsc.start();

    return () => {
      try {
        osc.stop();
        amOsc.stop();
        osc.disconnect();
      } catch {
        // ignore
      }
    };
  }

  private buildChimesSynthesizer(destination: GainNode): () => void {
    if (!this.ctx) return () => {};
    // Pentatonic bell frequencies
    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C5, D5, E5, G5, A5, C6

    this.chimesInterval = window.setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      if (Math.random() > 0.4) return;

      const now = this.ctx.currentTime;
      const noteFreq = pentatonic[Math.floor(Math.random() * pentatonic.length)];

      const fundamental = this.ctx.createOscillator();
      const overtone = this.ctx.createOscillator();
      const bellGain = this.ctx.createGain();

      fundamental.type = 'sine';
      fundamental.frequency.setValueAtTime(noteFreq, now);

      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(noteFreq * 2.76, now); // Metallic non-harmonic overtone

      bellGain.gain.setValueAtTime(0.09, now);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2); // Long resonant tail

      fundamental.connect(bellGain);
      overtone.connect(bellGain);
      bellGain.connect(destination);

      fundamental.start(now);
      overtone.start(now);
      fundamental.stop(now + 3.3);
      overtone.stop(now + 3.3);
    }, 1800);

    return () => {
      if (this.chimesInterval) window.clearInterval(this.chimesInterval);
    };
  }

  private buildWindSynthesizer(destination: GainNode): () => void {
    if (!this.ctx) return () => {};
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(450, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(3.5, this.ctx.currentTime);

    bandpass.connect(destination);
    const stopPink = this.buildNoiseSynthesizer('pink', bandpass as unknown as GainNode);

    // Wandering wind sweep
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(220, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(bandpass.frequency);
    lfo.start();

    return () => {
      stopPink();
      try {
        lfo.stop();
      } catch {
        // ignore
      }
    };
  }

  private buildThunderSynthesizer(destination: GainNode): () => void {
    if (!this.ctx) return () => {};
    // Low rumble triggered periodically
    const triggerThunder = () => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, now);
      filter.frequency.exponentialRampToValueAtTime(50, now + 4.0);

      const rumbleGain = this.ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.001, now);
      rumbleGain.gain.linearRampToValueAtTime(0.45, now + 0.4);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 4.5);

      filter.connect(rumbleGain);
      rumbleGain.connect(destination);

      const stopNoise = this.buildNoiseSynthesizer('brown', filter as unknown as GainNode);
      setTimeout(() => {
        stopNoise();
      }, 5000);

      // Schedule next thunder between 18s and 45s
      const nextDelay = 18000 + Math.random() * 27000;
      this.thunderTimeout = window.setTimeout(triggerThunder, nextDelay);
    };

    this.thunderTimeout = window.setTimeout(triggerThunder, 6000);

    return () => {
      if (this.thunderTimeout) window.clearTimeout(this.thunderTimeout);
    };
  }

  /**
   * Binaural Beat Generator using discrete ChannelMerger for pure Left/Right separation
   */
  private buildBinauralSynthesizer(destination: GainNode, targetHz = 10): () => void {
    if (!this.ctx) return () => {};

    const merger = this.ctx.createChannelMerger(2);
    const baseCarrier = 216;
    const half = targetHz / 2;

    this.binauralLeftOsc = this.ctx.createOscillator();
    this.binauralLeftOsc.type = 'sine';
    this.binauralLeftOsc.frequency.setValueAtTime(baseCarrier - half, this.ctx.currentTime);

    this.binauralRightOsc = this.ctx.createOscillator();
    this.binauralRightOsc.type = 'sine';
    this.binauralRightOsc.frequency.setValueAtTime(baseCarrier + half, this.ctx.currentTime);

    this.binauralLeftGain = this.ctx.createGain();
    this.binauralLeftGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

    this.binauralRightGain = this.ctx.createGain();
    this.binauralRightGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

    this.binauralLeftOsc.connect(this.binauralLeftGain);
    this.binauralLeftGain.connect(merger, 0, 0); // Left audio channel

    this.binauralRightOsc.connect(this.binauralRightGain);
    this.binauralRightGain.connect(merger, 0, 1); // Right audio channel

    merger.connect(destination);

    this.binauralLeftOsc.start();
    this.binauralRightOsc.start();

    return () => {
      try {
        this.binauralLeftOsc?.stop();
        this.binauralRightOsc?.stop();
      } catch {
        // ignore
      }
    };
  }

  /**
   * Lo-Fi Tape Drone: lush polyphonic analog chords with tape wow/flutter
   */
  private buildLoFiDroneSynthesizer(destination: GainNode): () => void {
    if (!this.ctx) return () => {};

    // Ambient chords (Fmaj9: F3, A3, C4, E4, G4)
    const chordProgressions = [
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [130.81, 164.81, 196.0, 246.94], // Cmaj7
      [110.0, 130.81, 164.81, 220.0],  // Am7
      [196.0, 246.94, 293.66, 392.0],  // G
    ];

    let currentChordIdx = 0;
    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, this.ctx.currentTime);

    filter.connect(droneGain);
    droneGain.connect(destination);

    const playChord = (notes: number[]) => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime;

      // Clean up previous oscillators
      this.droneOscillators.forEach((osc) => {
        try {
          osc.stop(now + 1.2);
        } catch {
          // ignore
        }
      });
      this.droneOscillators = [];

      notes.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const noteGain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        // Subtle tape wow modulation
        const wowOsc = this.ctx!.createOscillator();
        const wowGain = this.ctx!.createGain();
        wowOsc.frequency.setValueAtTime(0.3 + Math.random() * 0.2, now);
        wowGain.gain.setValueAtTime(0.8, now);
        wowOsc.connect(wowGain);
        wowGain.connect(osc.frequency);
        wowOsc.start(now);

        noteGain.gain.setValueAtTime(0.001, now);
        noteGain.gain.linearRampToValueAtTime(0.12, now + 1.5);

        osc.connect(noteGain);
        noteGain.connect(filter);

        osc.start(now);
        this.droneOscillators.push(osc);
      });
    };

    playChord(chordProgressions[0]);

    this.droneInterval = window.setInterval(() => {
      currentChordIdx = (currentChordIdx + 1) % chordProgressions.length;
      playChord(chordProgressions[currentChordIdx]);
    }, 8000);

    return () => {
      if (this.droneInterval) window.clearInterval(this.droneInterval);
      this.droneOscillators.forEach((osc) => {
        try {
          osc.stop();
        } catch {
          // ignore
        }
      });
      this.droneOscillators = [];
    };
  }

  /**
   * Synthesize a calming Zen bell chime for timer completion
   */
  public playZenChime(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const chimeFreq = 587.33; // D5

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(chimeFreq, now);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(chimeFreq * 2.01, now); // Slightly detuned harmonic

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 4.6);
    osc2.stop(now + 4.6);
  }

  /**
   * Retrieves live frequency and waveform data for canvas visualizer
   */
  public getVisualizerData(): { frequencyData: Uint8Array; timeDomainData: Uint8Array } {
    if (!this.analyser) {
      return {
        frequencyData: new Uint8Array(256),
        timeDomainData: new Uint8Array(256).fill(128),
      };
    }
    const freq = new Uint8Array(this.analyser.frequencyBinCount);
    const time = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteFrequencyData(freq);
    this.analyser.getByteTimeDomainData(time);
    return { frequencyData: freq, timeDomainData: time };
  }
}

export const audioEngine = new KomorebiAudioEngine();

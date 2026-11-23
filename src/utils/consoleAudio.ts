import { CIYI_MUSIC_TRACKS } from '../data/cartridges';

// Web Audio API SFX + Real MP3 Audio Player for CIYI.exe metallic chrome handheld console

class ConsoleAudioEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;

  // Real MP3 playback state
  private audioEl: HTMLAudioElement | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private freqData: Uint8Array<ArrayBuffer> | null = null;
  private musicPlaying = false;
  private currentTrackIndex = 0;
  private onEndedCallback: (() => void) | null = null;

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private ensureAudioElement(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioEl) {
      const el = new Audio();
      el.preload = 'metadata';
      el.volume = 0.72;
      el.addEventListener('ended', () => {
        if (this.onEndedCallback) {
          this.onEndedCallback();
        }
      });
      this.audioEl = el;
    }

    // Hook up Web Audio AnalyserNode once for live equalizer bars
    const ctx = this.getContext();
    if (ctx && this.audioEl && !this.sourceNode) {
      try {
        this.sourceNode = ctx.createMediaElementSource(this.audioEl);
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 64;
        this.freqData = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
        this.sourceNode.connect(this.analyser);
        this.analyser.connect(ctx.destination);
      } catch {
        // Fallback: audio still plays cleanly through HTML5 Audio even if Analyser hook fails
      }
    }

    return this.audioEl;
  }

  public setOnTrackEnded(cb: (() => void) | null): void {
    this.onEndedCallback = cb;
  }

  public setEnabled(next: boolean): void {
    this.enabled = next;
    if (!next) {
      this.stopMusic();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public playPowerOn(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(240, now);
    clickOsc.frequency.exponentialRampToValueAtTime(80, now + 0.06);
    clickGain.gain.setValueAtTime(0.11, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.08);

    const notes = [
      { freq: 523.25, t: 0.25, dur: 0.14 },
      { freq: 783.99, t: 0.36, dur: 0.14 },
      { freq: 1046.5, t: 0.48, dur: 0.45 },
    ];

    notes.forEach(({ freq, t, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + t);
      gain.gain.setValueAtTime(0.001, now + t);
      gain.gain.linearRampToValueAtTime(0.075, now + t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + dur + 0.02);
    });
  }

  public playButtonClick(kind: 'dpad' | 'a' | 'b' | 'meta' = 'dpad'): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const pitch = kind === 'a' ? 980 : kind === 'b' ? 620 : kind === 'meta' ? 760 : 840;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.42, now + 0.045);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  public playSdInsert(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    [0, 0.14].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(i === 0 ? 320 : 540, now + offset);
      osc.frequency.exponentialRampToValueAtTime(110, now + offset + 0.055);

      gain.gain.setValueAtTime(0.05, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.065);
    });
  }

  public playSdEject(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.09);

    gain.gain.setValueAtTime(0.075, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playLoadingBlip(step = 0): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660 + (step % 4) * 110, now);

    gain.gain.setValueAtTime(0.025, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  public playAccessGranted(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const chord = [587.33, 739.99, 880, 1174.66];
    chord.forEach((freq, idx) => {
      const t = now + idx * 0.075;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.06, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.34);
    });
  }

  public playCardFlip(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.09);

    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playGameCatch(isBonus = false): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = isBonus ? [880, 1174.66, 1567.98] : [783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * 0.055);
      gain.gain.setValueAtTime(0.032, now + i * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.055 + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.11);
    });
  }

  public playGameHit(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(85, now + 0.18);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.21);
  }

  public playFinalUnlock(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const melody = [
      { freq: 523.25, t: 0, dur: 0.16 },
      { freq: 659.25, t: 0.12, dur: 0.16 },
      { freq: 783.99, t: 0.24, dur: 0.16 },
      { freq: 1046.5, t: 0.36, dur: 0.28 },
      { freq: 987.77, t: 0.54, dur: 0.18 },
      { freq: 1046.5, t: 0.7, dur: 0.55 },
    ];

    melody.forEach(({ freq, t, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + t);

      gain.gain.setValueAtTime(0.001, now + t);
      gain.gain.linearRampToValueAtTime(0.07, now + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + dur + 0.03);
    });
  }

  // ==================== REAL MP3 AUDIO PLAYBACK ====================
  public startMusic(trackIndex = this.currentTrackIndex): void {
    if (!this.enabled) return;
    const el = this.ensureAudioElement();
    if (!el) return;

    const track = CIYI_MUSIC_TRACKS[trackIndex] || CIYI_MUSIC_TRACKS[0];
    const isDifferentTrack = this.currentTrackIndex !== trackIndex || !el.src.endsWith(track.src);

    this.currentTrackIndex = trackIndex;
    if (isDifferentTrack) {
      el.src = track.src;
      el.currentTime = 0;
    }

    this.getContext();
    this.musicPlaying = true;
    el.play().catch(() => {
      this.musicPlaying = false;
    });
  }

  public pauseMusic(): void {
    this.musicPlaying = false;
    if (this.audioEl) {
      this.audioEl.pause();
    }
  }

  public stopMusic(): void {
    this.musicPlaying = false;
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
    }
  }

  public seekToRatio(ratio: number): void {
    if (!this.audioEl || !Number.isFinite(this.audioEl.duration) || this.audioEl.duration <= 0) {
      return;
    }
    this.audioEl.currentTime = Math.max(0, Math.min(1, ratio)) * this.audioEl.duration;
  }

  public getPlaybackState(): { currentTime: number; duration: number; bars: number[] } {
    const currentTime = this.audioEl ? this.audioEl.currentTime || 0 : 0;
    const duration =
      this.audioEl && Number.isFinite(this.audioEl.duration) ? this.audioEl.duration : 0;

    const bars: number[] = [];
    if (this.musicPlaying && this.analyser && this.freqData) {
      this.analyser.getByteFrequencyData(this.freqData);
      for (let i = 0; i < 14; i += 1) {
        const val = this.freqData[i] ?? 0;
        bars.push(Math.max(18, Math.round((val / 255) * 96)));
      }
    } else {
      for (let i = 0; i < 14; i += 1) {
        bars.push(18);
      }
    }

    return { currentTime, duration, bars };
  }

  public isMusicPlaying(): boolean {
    return this.musicPlaying;
  }
}

export const consoleAudio = new ConsoleAudioEngine();

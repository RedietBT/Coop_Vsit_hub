/**
 * CoopBank Audio Notification Synthesizer using Web Audio API.
 * Generates a pleasant, banking-grade melodic chime (C5 -> E5) without needing external audio assets.
 */
class SoundPlayer {
  constructor() {
    this.audioCtx = null;
    this.isMuted = localStorage.getItem('coop_sound_muted') === 'true';
  }

  getAudioContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  setMuted(muted) {
    this.isMuted = muted;
    localStorage.setItem('coop_sound_muted', String(muted));
  }

  isSoundMuted() {
    return this.isMuted;
  }

  /**
   * Plays a pleasant 2-tone melodic notification chime (C5 -> E5).
   */
  playNotificationChime() {
    if (this.isMuted) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Master Gain for smooth volume control
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.12, now);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      masterGain.connect(ctx.destination);

      // Note 1: C5 (523.25 Hz)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.connect(masterGain);

      // Note 2: E5 (659.25 Hz)
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.12);
      osc2.connect(masterGain);

      osc1.start(now);
      osc1.stop(now + 0.14);

      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);
    } catch (e) {
      console.warn('Audio chime playback failed:', e);
    }
  }

  /**
   * Plays a subtle click sound for buttons.
   */
  playClickSound() {
    if (this.isMuted) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      // Ignored for non-critical click sound
    }
  }
}

export const soundPlayer = new SoundPlayer();
export default soundPlayer;

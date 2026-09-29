/**
 * Web Audio API Telemetry Synthesizer & Medical Alarm Service
 * Produces calibrated IEC 60601-1-8 medical telemetry alert patterns for ICU patient crises.
 */

class AlarmService {
  private audioCtx: AudioContext | null = null;
  private intervalId: any = null;
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private currentAlertId: string | null = null;
  private acknowledgedAlerts: Set<string> = new Set();
  private userInteracted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const handleUserGesture = () => {
        this.userInteracted = true;
        this.unlockAudio();
        window.removeEventListener('click', handleUserGesture);
        window.removeEventListener('keydown', handleUserGesture);
        window.removeEventListener('touchstart', handleUserGesture);
      };
      window.addEventListener('click', handleUserGesture);
      window.addEventListener('keydown', handleUserGesture);
      window.addEventListener('touchstart', handleUserGesture);
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public unlockAudio(): void {
    const ctx = this.getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  private playTone(freq: number, durationSec: number, startTime: number): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      // Fast hospital monitor beep envelope (attack - decay)
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.35, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + durationSec);
    } catch (e) {
      console.warn('Web Audio playTone warning:', e);
    }
  }

  /**
   * Play urgent medical burst (triplet telemetry warning: 880Hz, 880Hz, 988Hz)
   */
  private playMedicalBurst(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    this.playTone(880, 0.12, now);
    this.playTone(880, 0.12, now + 0.16);
    this.playTone(988, 0.20, now + 0.32);
  }

  /**
   * Triggers the continuous repeating critical alarm sound
   */
  public playCriticalAlarm(alertId?: string): void {
    if (alertId && this.acknowledgedAlerts.has(alertId)) {
      return; // Already acknowledged and muted
    }
    if (alertId) {
      this.currentAlertId = alertId;
    }

    if (this.isPlaying || this.isMuted) return;

    this.unlockAudio();
    this.isPlaying = true;

    // Immediately play first pulse
    this.playMedicalBurst();

    // Repeat every 1.5 seconds for urgent telemetry alarm
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      if (!this.isPlaying || this.isMuted) {
        this.stopAlarm();
        return;
      }
      this.playMedicalBurst();
    }, 1500);
  }

  /**
   * Stops the critical alarm audio
   */
  public stopAlarm(): void {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Acknowledges and mutes the current or target alert
   */
  public acknowledgeAlarm(alertId?: string): void {
    const idToAck = alertId || this.currentAlertId;
    if (idToAck) {
      this.acknowledgedAlerts.add(idToAck);
    }
    this.stopAlarm();
  }

  /**
   * Returns whether the alarm is currently sounding
   */
  public isAlarmPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Resets acknowledged alarm memory (e.g. for testing)
   */
  public resetAcknowledged(): void {
    this.acknowledgedAlerts.clear();
  }
}

export const alarmService = new AlarmService();

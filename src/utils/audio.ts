interface AudioSettings {
  volume?: number;
  muted?: boolean;
}

export class AudioManager {
  private sounds: Map<string, HTMLAudioElement>;
  private _volume: number;
  private _isMuted: boolean;

  constructor(settings: AudioSettings = {}) {
    this.sounds = new Map();
    this._volume = settings.volume ?? 1;
    this._isMuted = settings.muted ?? false;
  }

  get volume(): number {
    return this._volume;
  }

  get isMuted(): boolean {
    return this._isMuted;
  }

  async loadSound(name: string, src: string): Promise<HTMLAudioElement> {
    try {
      const audio = new Audio(src);
      audio.volume = this._volume;
      this.sounds.set(name, audio);
      return audio;
    } catch (error) {
      console.error(`Failed to load sound: ${name}`, error);
      throw error;
    }
  }

  async playSound(name: string): Promise<void> {
    if (this._isMuted) return;
    
    const sound = this.sounds.get(name);
    if (sound) {
      try {
        await sound.play();
      } catch (error) {
        console.error(`Failed to play sound: ${name}`, error);
      }
    }
  }

  stopSound(name: string): void {
    const sound = this.sounds.get(name);
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  }

  setVolume(value: number): void {
    this._volume = Math.max(0, Math.min(1, value));
    this.sounds.forEach(sound => {
      sound.volume = this._volume;
    });
  }

  toggleMute(): void {
    this._isMuted = !this._isMuted;
  }

  cleanup(): void {
    this.sounds.forEach(sound => {
      sound.pause();
      sound.remove();
    });
    this.sounds.clear();
  }
} 
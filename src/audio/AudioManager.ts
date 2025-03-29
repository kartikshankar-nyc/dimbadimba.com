export class AudioManager {
  private sounds: Map<string, HTMLAudioElement>;
  private volume: number = 1.0;
  public context: AudioContext | null = null;

  constructor() {
    this.sounds = new Map();
    try {
      // @ts-ignore - webkitAudioContext may not exist on window type
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.error('Web Audio API is not supported in this browser');
    }
  }

  async loadSound(name: string, src: string): Promise<void> {
    try {
      const audio = new Audio(src);
      await new Promise<void>((resolve, reject) => {
        audio.addEventListener('canplaythrough', () => resolve());
        audio.addEventListener('error', () => reject(new Error(`Failed to load audio: ${src}`)));
        audio.load();
      });
      this.sounds.set(name, audio);
    } catch (error) {
      console.error(`Failed to load sound: ${name}`, error);
      throw error;
    }
  }

  playSound(name: string): void {
    const sound = this.sounds.get(name);
    if (sound) {
      sound.volume = this.volume;
      sound.currentTime = 0;
      sound.play().catch(error => {
        console.error(`Failed to play sound: ${name}`, error);
      });
    }
  }

  stopSound(name: string): void {
    const sound = this.sounds.get(name);
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(sound => {
      sound.volume = this.volume;
    });
  }

  cleanup(): void {
    this.sounds.forEach(sound => {
      sound.pause();
      if (typeof sound.remove === 'function') {
        sound.remove();
      }
    });
    this.sounds.clear();
    if (this.context) {
      this.context.close();
    }
  }

  createOscillator(frequency: number, duration: number): void {
    if (!this.context) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.frequency.value = frequency;
    gainNode.gain.value = this.volume;

    oscillator.start();
    oscillator.stop(this.context.currentTime + duration);
  }
} 
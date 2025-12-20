import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audioContext: AudioContext | null = null;

  constructor() {
    // Inicializar AudioContext apenas quando necessário (após interação do usuário)
  }

  /**
   * Toca um beep simples de notificação
   */
  playNotificationSound(): void {
    try {
      // Criar AudioContext se não existir
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Frequência do beep (440Hz = nota Lá)
      const frequency = 440;
      // Duração do beep (200ms)
      const duration = 0.2;
      // Volume (0.3 = 30%)
      const volume = 0.3;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configurar o som
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine'; // Tipo de onda suave

      // Configurar volume com fade in/out para evitar clicks
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);

      // Tocar o som
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      // Silenciar erros de áudio (pode não funcionar em alguns navegadores ou sem interação do usuário)
      console.warn('Não foi possível reproduzir o som de notificação:', error);
    }
  }

  /**
   * Toca um beep duplo (dois beeps rápidos)
   */
  playDoubleBeep(): void {
    this.playNotificationSound();
    setTimeout(() => {
      this.playNotificationSound();
    }, 150);
  }
}


/**
 * Utilitário de som para sintetizar a notificação estilo WhatsApp
 * via Web Audio API sem necessidade de arquivos externos de áudio.
 */
export function playWhatsAppChime() {
  if (typeof window === 'undefined') return;

  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const playBellTone = (freq: number, startTime: number, duration: number, gainValue: number = 0.25) => {
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(gainValue, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc2.start(startTime);
      osc.stop(startTime + duration);
      osc2.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Tom 1 (E5: 659Hz) -> Tom 2 (E6: 1318Hz) estilo marimba do WhatsApp
    playBellTone(659.25, now, 0.12, 0.25);
    playBellTone(1318.51, now + 0.08, 0.25, 0.30);
  } catch (e) {
    console.warn('Web Audio chime not allowed yet:', e);
  }
}

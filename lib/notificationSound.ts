/** Short two-tone chime via the Web Audio API — no external asset required. */
export function playNotificationSound() {
  if (typeof window === "undefined") return;
  try {
    type LegacyWindow = Window & { webkitAudioContext?: typeof AudioContext };
    const Ctx = window.AudioContext || (window as LegacyWindow).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();

    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(880, now, 0.15);
    playTone(1320, now + 0.12, 0.18);

    setTimeout(() => ctx.close().catch(() => {}), 500);
  } catch {
    /* Autoplay/permission errors are non-fatal — silently skip the chime. */
  }
}

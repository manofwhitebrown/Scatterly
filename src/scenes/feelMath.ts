export const URGENT_SEC = 20;

/** Rush urgency over the last 20 s: music intensity 0.6 to 1, tint alpha 0.04 to 0.24, pulse FX only in the last 10 s. Null outside the window. */
export function urgencyAt(sec: number): { intensity: number; alpha: number; pulse: boolean; red: boolean } | null {
  if (sec > URGENT_SEC || sec <= 0) return null;
  const k = URGENT_SEC - sec; // 0..19
  return { intensity: Math.min(1, 0.6 + k * 0.022), alpha: 0.04 + k * 0.0105, pulse: sec <= 10, red: sec <= 5 };
}

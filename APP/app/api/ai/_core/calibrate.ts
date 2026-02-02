// APP/app/api/ai/_core/calibrate.ts

export function calibrateConfidence(raw: number) {
  if (!raw || isNaN(raw)) return 0.2;

  if (raw > 1) raw = 1;
  if (raw < 0) raw = 0;

  return 0.3 + raw * 0.7;
}

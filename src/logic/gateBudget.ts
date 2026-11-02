/** Gates per morning by day; a Big Search morning allows up to 6. */
export function gateBudget(day: number, big = false): number {
  if (big) return 6;
  if (day <= 1) return 1;
  if (day <= 3) return 2;
  if (day <= 9) return 3;
  return 4;
}

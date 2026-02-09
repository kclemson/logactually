export function getTargetDotColor(calories: number, target: number): string {
  const overPercent = ((calories - target) / target) * 100;
  if (overPercent <= 2.5) return "text-green-500 dark:text-green-400";
  if (overPercent <= 10) return "text-amber-500 dark:text-amber-400";
  return "text-rose-500 dark:text-rose-400";
}

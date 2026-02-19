export function getMedicationMeta(logType: {
  value_type: string;
  default_dose: number | null;
  unit: string | null;
  doses_per_day: number;
}): string | null {
  if (logType.value_type !== 'medication') return null;
  const dosePart = logType.default_dose != null && logType.unit
    ? `${logType.default_dose} ${logType.unit}`
    : logType.unit || null;
  const freqPart = logType.doses_per_day > 0
    ? `${logType.doses_per_day}x/day`
    : 'as needed';
  return dosePart ? `${dosePart} · ${freqPart}` : freqPart;
}

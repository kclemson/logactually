export type WeightUnit = 'lbs' | 'kg';

const LBS_TO_KG = 0.453592;
const KG_TO_LBS = 2.20462;

export function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return value;
  return from === 'lbs' ? value * LBS_TO_KG : value * KG_TO_LBS;
}

export function formatWeight(lbs: number, unit: WeightUnit, decimals = 1): string {
  const value = unit === 'kg' ? lbs * LBS_TO_KG : lbs;
  return `${value.toFixed(decimals)}`;
}

export function formatWeightWithUnit(lbs: number, unit: WeightUnit, decimals = 1): string {
  return `${formatWeight(lbs, unit, decimals)} ${unit}`;
}

export function parseWeightToLbs(value: number, unit: WeightUnit): number {
  // Convert user input to lbs for storage
  return unit === 'kg' ? value * KG_TO_LBS : value;
}

export function getWeightUnitLabel(unit: WeightUnit): string {
  return unit === 'kg' ? 'Kg' : 'Lbs';
}

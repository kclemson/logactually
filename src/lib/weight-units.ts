export type WeightUnit = 'lbs' | 'kg';
export type DistanceUnit = 'mi' | 'km';
export type SpeedUnit = 'mph' | 'km/h';

const LBS_TO_KG = 0.453592;
const KG_TO_LBS = 2.20462;
const MI_TO_KM = 1.60934;
const KM_TO_MI = 0.621371;

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

export function convertDistance(value: number, from: DistanceUnit, to: DistanceUnit): number {
  if (from === to) return value;
  return from === 'mi' ? value * MI_TO_KM : value * KM_TO_MI;
}

export function getDistanceUnitLabel(unit: DistanceUnit): string {
  return unit === 'km' ? 'Km' : 'Mi';
}

export function convertSpeed(value: number, from: SpeedUnit, to: SpeedUnit): number {
  if (from === to) return value;
  return from === 'mph' ? value * MI_TO_KM : value * KM_TO_MI;
}

export function formatDurationMmSs(decimalMinutes: number): string {
  const totalSeconds = Math.round(decimalMinutes * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

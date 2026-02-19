import type { ValueType } from '@/hooks/useCustomLogTypes';
import type { WeightUnit } from '@/lib/weight-units';

export interface LogTemplate {
  name: string;
  displayName?: string; // short label for checkbox UI (e.g. "Waist")
  valueType: ValueType;
  unitImperial: string | null;
  unitMetric: string | null;
  icon: string; // lucide icon name
  group?: string; // grouping key (e.g. 'measurement')
}

export const LOG_TEMPLATES: LogTemplate[] = [
  { name: 'Body Weight',            valueType: 'numeric',        unitImperial: 'lbs',  unitMetric: 'kg',   icon: 'Scale' },
  { name: 'Waist Measurement',      valueType: 'numeric',        unitImperial: 'in',   unitMetric: 'cm',   icon: 'Ruler', group: 'measurement', displayName: 'Waist' },
  { name: 'Hips Measurement',       valueType: 'numeric',        unitImperial: 'in',   unitMetric: 'cm',   icon: 'Ruler', group: 'measurement', displayName: 'Hips' },
  { name: 'Chest Measurement',      valueType: 'numeric',        unitImperial: 'in',   unitMetric: 'cm',   icon: 'Ruler', group: 'measurement', displayName: 'Chest' },
  { name: 'Bicep Measurement',      valueType: 'numeric',        unitImperial: 'in',   unitMetric: 'cm',   icon: 'Ruler', group: 'measurement', displayName: 'Bicep' },
  { name: 'Thigh Measurement',      valueType: 'numeric',        unitImperial: 'in',   unitMetric: 'cm',   icon: 'Ruler', group: 'measurement', displayName: 'Thigh' },
  { name: 'Neck Measurement',       valueType: 'numeric',        unitImperial: 'in',   unitMetric: 'cm',   icon: 'Ruler', group: 'measurement', displayName: 'Neck' },
  { name: 'Body Fat %',             valueType: 'numeric',        unitImperial: '%',    unitMetric: '%',    icon: 'Percent' },
  { name: 'Blood Pressure',         valueType: 'dual_numeric',   unitImperial: 'mmHg', unitMetric: 'mmHg', icon: 'HeartPulse' },
  { name: 'Medication',             valueType: 'medication',     unitImperial: null,   unitMetric: null,   icon: 'Pill' },
  { name: 'Sleep',                  valueType: 'numeric',        unitImperial: 'hrs',  unitMetric: 'hrs',  icon: 'Moon' },
  { name: 'Water Intake',           valueType: 'numeric',        unitImperial: 'oz',   unitMetric: 'ml',   icon: 'Droplets' },
  { name: 'Mood',                   valueType: 'text',           unitImperial: null,   unitMetric: null,   icon: 'Smile' },
  { name: 'Journal',                valueType: 'text_multiline', unitImperial: null,   unitMetric: null,   icon: 'BookOpen' },
];

export const MEASUREMENT_TEMPLATES = LOG_TEMPLATES.filter(t => t.group === 'measurement');

export function getTemplateUnit(template: LogTemplate, weightUnit: WeightUnit): string | null {
  return weightUnit === 'kg' ? template.unitMetric : template.unitImperial;
}

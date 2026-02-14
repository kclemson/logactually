import type { ValueType } from '@/hooks/useCustomLogTypes';
import type { WeightUnit } from '@/lib/weight-units';

export interface LogTemplate {
  name: string;
  valueType: ValueType;
  unitImperial: string | null;
  unitMetric: string | null;
  icon: string; // lucide icon name
}

export const LOG_TEMPLATES: LogTemplate[] = [
  { name: 'Body Weight',       valueType: 'numeric',        unitImperial: 'lbs', unitMetric: 'kg',  icon: 'Scale' },
  { name: 'Body Measurements', valueType: 'text_numeric',   unitImperial: 'in',  unitMetric: 'cm',  icon: 'Ruler' },
  { name: 'Body Fat %',        valueType: 'numeric',        unitImperial: '%',   unitMetric: '%',   icon: 'Percent' },
  { name: 'Blood Pressure',    valueType: 'dual_numeric',   unitImperial: 'mmHg', unitMetric: 'mmHg', icon: 'HeartPulse' },
  { name: 'Sleep',             valueType: 'numeric',        unitImperial: 'hrs', unitMetric: 'hrs', icon: 'Moon' },
  { name: 'Mood',              valueType: 'text',           unitImperial: null,  unitMetric: null,  icon: 'Smile' },
  { name: 'Journal',           valueType: 'text_multiline', unitImperial: null,  unitMetric: null,  icon: 'BookOpen' },
  { name: 'Water Intake',      valueType: 'numeric',        unitImperial: 'oz',  unitMetric: 'ml',  icon: 'Droplets' },
];

export function getTemplateUnit(template: LogTemplate, weightUnit: WeightUnit): string | null {
  return weightUnit === 'kg' ? template.unitMetric : template.unitImperial;
}

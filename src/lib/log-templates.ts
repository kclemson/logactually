import type { ValueType } from '@/hooks/useCustomLogTypes';
import type { WeightUnit } from '@/lib/weight-units';

export interface LogTemplate {
  name: string;
  displayName?: string; // short label for checkbox UI (e.g. "Waist")
  valueType: ValueType;
  unitImperial: string | null;
  unitMetric: string | null;
  icon: string; // lucide icon name
  group: 'body' | 'health' | 'memory'; // grouping key for the picker sections
}

export const LOG_TEMPLATES: LogTemplate[] = [
  // Body
  { name: 'Body Weight',            valueType: 'numeric',        unitImperial: 'lbs',  unitMetric: 'kg',   icon: 'Scale',      group: 'body' },
  { name: 'Body Fat %',             valueType: 'numeric',        unitImperial: '%',    unitMetric: '%',    icon: 'Percent',    group: 'body' },
  { name: 'Waist Measurement',      valueType: 'numeric',        unitImperial: 'in',   unitMetric: 'cm',   icon: 'Ruler',      group: 'body', displayName: 'Waist' },
  { name: 'Hips Measurement',       valueType: 'numeric',        unitImperial: 'in',   unitMetric: 'cm',   icon: 'Ruler',      group: 'body', displayName: 'Hips' },
  { name: 'Chest Measurement',      valueType: 'numeric',        unitImperial: 'in',   unitMetric: 'cm',   icon: 'Ruler',      group: 'body', displayName: 'Chest' },
  { name: 'Bicep Measurement',      valueType: 'numeric',        unitImperial: 'in',   unitMetric: 'cm',   icon: 'Ruler',      group: 'body', displayName: 'Bicep' },
  { name: 'Thigh Measurement',      valueType: 'numeric',        unitImperial: 'in',   unitMetric: 'cm',   icon: 'Ruler',      group: 'body', displayName: 'Thigh' },
  { name: 'Neck Measurement',       valueType: 'numeric',        unitImperial: 'in',   unitMetric: 'cm',   icon: 'Ruler',      group: 'body', displayName: 'Neck' },
  // Health
  { name: 'Blood Pressure',         valueType: 'dual_numeric',   unitImperial: 'mmHg', unitMetric: 'mmHg', icon: 'HeartPulse', group: 'health' },
  { name: 'Sleep',                  valueType: 'numeric',        unitImperial: 'hrs',  unitMetric: 'hrs',  icon: 'Moon',       group: 'health' },
  { name: 'Water Intake',           valueType: 'numeric',        unitImperial: 'oz',   unitMetric: 'ml',   icon: 'Droplets',   group: 'health' },
  { name: 'Bloodwork',              valueType: 'panel',          unitImperial: null,   unitMetric: null,   icon: 'Droplets',   group: 'health' },
  { name: 'Medication',             valueType: 'medication',     unitImperial: null,   unitMetric: null,   icon: 'Pill',       group: 'health' },
  // Photo Scrapbook
  { name: 'Photo Scrapbook',        valueType: 'memory',         unitImperial: null,   unitMetric: null,   icon: 'Images',     group: 'memory' },
];

export const TEMPLATE_GROUPS: { key: LogTemplate['group']; label: string }[] = [
  { key: 'body', label: 'Body' },
  { key: 'health', label: 'Health' },
  { key: 'memory', label: 'Photo Scrapbook' },
];

export function getTemplateUnit(template: LogTemplate, weightUnit: WeightUnit): string | null {
  return weightUnit === 'kg' ? template.unitMetric : template.unitImperial;
}

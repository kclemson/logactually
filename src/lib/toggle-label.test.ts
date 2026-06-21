import { describe, it, expect } from 'vitest';
import { getToggleLabel } from './toggle-label';

describe('getToggleLabel', () => {
  it('maps built-in names to canonical short labels', () => {
    expect(getToggleLabel('Photo Scrapbook')).toBe('Scrapbook');
    expect(getToggleLabel('Body Weight')).toBe('Weight');
    expect(getToggleLabel('Body Fat %')).toBe('Body Fat');
    expect(getToggleLabel('Blood Pressure')).toBe('BP');
    expect(getToggleLabel('Water Intake')).toBe('Water');
    expect(getToggleLabel('Medication')).toBe('Meds');
  });

  it('maps the legacy Memories name to Scrapbook', () => {
    expect(getToggleLabel('Memories')).toBe('Scrapbook');
  });

  it('strips the redundant " Measurement" suffix', () => {
    expect(getToggleLabel('Waist Measurement')).toBe('Waist');
    expect(getToggleLabel('Bicep Measurement')).toBe('Bicep');
  });

  it('passes short user names through unchanged', () => {
    expect(getToggleLabel('Mood')).toBe('Mood');
    expect(getToggleLabel('Steps')).toBe('Steps');
  });

  it('truncates long user names with an ellipsis', () => {
    expect(getToggleLabel('Morning Meditation Minutes')).toBe('Morning Me…');
    expect(getToggleLabel('Morning Meditation Minutes').length).toBe(11);
  });

  it('trims surrounding whitespace', () => {
    expect(getToggleLabel('  Sleep  ')).toBe('Sleep');
  });

  it('respects a custom maxLen', () => {
    expect(getToggleLabel('Hydration', 4)).toBe('Hyd…');
  });
});

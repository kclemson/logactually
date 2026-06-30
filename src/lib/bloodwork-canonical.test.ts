import { describe, it, expect } from 'vitest';
import {
  BLOODWORK_CANONICAL,
  canonicalize,
  classifyUnit,
  normalize,
} from './bloodwork-canonical';

// ---------------------------------------------------------------------------
// Every synonym resolves to its own entry
// ---------------------------------------------------------------------------

describe('canonicalize — every synonym in the dictionary', () => {
  for (const entry of BLOODWORK_CANONICAL) {
    for (const syn of entry.synonyms) {
      it(`"${syn}" → ${entry.key}`, () => {
        const result = canonicalize(syn);
        expect(result.canonical_key).toBe(entry.key);
        expect(result.display_name).toBe(entry.display);
      });
    }
  }
});

// ---------------------------------------------------------------------------
// Every display name round-trips to its own entry
// ---------------------------------------------------------------------------

describe('canonicalize — every display name round-trips', () => {
  for (const entry of BLOODWORK_CANONICAL) {
    it(`display "${entry.display}" → ${entry.key}`, () => {
      const result = canonicalize(entry.display);
      expect(result.canonical_key).toBe(entry.key);
      expect(result.display_name).toBe(entry.display);
    });
  }
});

// ---------------------------------------------------------------------------
// No two analytes share a normalized synonym (collision guard)
// ---------------------------------------------------------------------------

describe('dictionary integrity — no synonym collisions', () => {
  it('no normalized string maps to two different keys', () => {
    const seen = new Map<string, string>(); // normalized string -> key
    const collisions: string[] = [];

    for (const entry of BLOODWORK_CANONICAL) {
      const strings = [...entry.synonyms, entry.display];
      for (const raw of strings) {
        const norm = normalize(raw);
        const existing = seen.get(norm);
        if (existing && existing !== entry.key) {
          collisions.push(
            `"${raw}" (normalized "${norm}") maps to both "${existing}" and "${entry.key}"`,
          );
        } else {
          seen.set(norm, entry.key);
        }
      }
    }

    expect(collisions, collisions.join('\n')).toEqual([]);
  });

  it('every canonical key is unique', () => {
    const keys = BLOODWORK_CANONICAL.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('no empty synonyms and no entry without synonyms', () => {
    for (const entry of BLOODWORK_CANONICAL) {
      expect(entry.synonyms.length).toBeGreaterThan(0);
      for (const syn of entry.synonyms) {
        expect(normalize(syn).length).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Case / punctuation / spacing robustness
// ---------------------------------------------------------------------------

describe('canonicalize — normalization robustness', () => {
  it('is case-insensitive', () => {
    expect(canonicalize('IRON').canonical_key).toBe('iron_serum');
    expect(canonicalize('iron').canonical_key).toBe('iron_serum');
  });

  it('tolerates extra whitespace', () => {
    expect(canonicalize('  Total   Cholesterol  ').canonical_key).toBe('total_cholesterol');
  });

  it('tolerates comma forms', () => {
    expect(canonicalize('Iron, SRM').canonical_key).toBe('iron_serum');
    expect(canonicalize('Folate, SRM').canonical_key).toBe('folate');
    expect(canonicalize('Carbon Dioxide, Total').canonical_key).toBe('co2');
  });

  it('tolerates parenthetical and slash forms', () => {
    expect(canonicalize('LDL Chol Calc (NIH)').canonical_key).toBe('ldl_cholesterol');
    expect(canonicalize('T. Chol/HDL Ratio').canonical_key).toBe('chol_hdl_ratio');
    expect(canonicalize('eGFR by CKD-EPI 2021').canonical_key).toBe('egfr');
  });

  it('merges abbreviated CBC differential labels', () => {
    expect(canonicalize('Basos').canonical_key).toBe('basophils_pct');
    expect(canonicalize('Eos').canonical_key).toBe('eosinophils_pct');
    expect(canonicalize('Lymphs').canonical_key).toBe('lymphocytes_pct');
    expect(canonicalize('Lymphs (Absolute)').canonical_key).toBe('lymphocytes_abs');
    expect(canonicalize('Eos (Absolute)').canonical_key).toBe('eosinophils_abs');
    expect(canonicalize('Absolute Lymphocyte Count').canonical_key).toBe('lymphocytes_abs');
  });
});

// ---------------------------------------------------------------------------
// Option 3: Beckman merges into the standard analyte, Dried Blood stays separate
// ---------------------------------------------------------------------------

describe('method/sample variants (Option 3)', () => {
  it('folds Beckman instrument variants into the standard venous analyte', () => {
    expect(canonicalize('AST (Beckman)').canonical_key).toBe('ast');
    expect(canonicalize('ALT (Beckman)').canonical_key).toBe('alt');
    expect(canonicalize('Total Bilirubin (Beckman)').canonical_key).toBe('bilirubin_total');
    expect(canonicalize('Direct Bilirubin (Beckman)').canonical_key).toBe('bilirubin_direct');
    expect(canonicalize('Total Protein (Beckman)').canonical_key).toBe('protein_total');
  });

  it('keeps at-home Dried Blood tests as their own series', () => {
    expect(canonicalize('Cholesterol, Total, Dried Bld').canonical_key).toBe('total_cholesterol_db');
    expect(canonicalize('HDL Cholesterol, Dried Blood').canonical_key).toBe('hdl_cholesterol_db');
    expect(canonicalize('LDL Chol Cal(NIH),DB').canonical_key).toBe('ldl_cholesterol_db');
    expect(canonicalize('Triglyceride, Dried Blood').canonical_key).toBe('triglycerides_db');
    expect(canonicalize('Hemoglobin A1c, Dried Blood').canonical_key).toBe('hba1c_db');
    expect(canonicalize('Est Avg Glu (eAG),DB').canonical_key).toBe('eag_db');
  });

  it('does NOT blend Dried Blood into the venous analyte', () => {
    expect(canonicalize('Cholesterol, Total, Dried Bld').canonical_key).not.toBe('total_cholesterol');
    expect(canonicalize('HDL Cholesterol, Dried Blood').canonical_key).not.toBe('hdl_cholesterol');
    expect(canonicalize('Hemoglobin A1c, Dried Blood').canonical_key).not.toBe('hba1c');
    expect(canonicalize('Triglyceride, Dried Blood').canonical_key).not.toBe('triglycerides');
  });
});

// ---------------------------------------------------------------------------
// Unknown fallback behavior
// ---------------------------------------------------------------------------

describe('canonicalize — unknown analyte fallback', () => {
  it('slugs an unknown name and preserves the raw display', () => {
    const result = canonicalize('  Some Unknown Marker XYZ  ');
    expect(result.canonical_key).toBe('some_unknown_marker_xyz');
    expect(result.display_name).toBe('Some Unknown Marker XYZ');
  });

  it('falls back to "unknown" for non-alphanumeric input', () => {
    expect(canonicalize('???').canonical_key).toBe('unknown');
  });
});

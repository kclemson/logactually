import { describe, it, expect } from 'vitest';
import { extractUpcFromText, SCANNED_BARCODE_PREFIX } from './upc-utils';

describe('extractUpcFromText', () => {
  it('extracts from "UPC: <digits>" format', () => {
    expect(extractUpcFromText('UPC: 717524611109')).toBe('717524611109');
  });

  it('extracts from "UPC code: <digits>" format', () => {
    expect(extractUpcFromText('UPC code: 717524611109')).toBe('717524611109');
  });

  it('extracts from "barcode: <digits>" format', () => {
    expect(extractUpcFromText('barcode: 717524611109')).toBe('717524611109');
  });

  it('extracts from "Scanned barcode: <digits>" format', () => {
    expect(extractUpcFromText('Scanned barcode: 717524611109')).toBe('717524611109');
  });

  it('extracts pure 12-digit UPC', () => {
    expect(extractUpcFromText('717524611109')).toBe('717524611109');
  });

  it('extracts pure 8-digit EAN-8', () => {
    expect(extractUpcFromText('12345678')).toBe('12345678');
  });

  it('extracts pure 13-digit EAN-13', () => {
    expect(extractUpcFromText('1234567890123')).toBe('1234567890123');
  });

  it('extracts pure 14-digit GTIN-14', () => {
    expect(extractUpcFromText('12345678901234')).toBe('12345678901234');
  });

  it('returns null for too-short digits', () => {
    expect(extractUpcFromText('1234567')).toBeNull();
  });

  it('returns null for too-long digits', () => {
    expect(extractUpcFromText('123456789012345')).toBeNull();
  });

  it('returns null for plain food text', () => {
    expect(extractUpcFromText('grilled chicken breast')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractUpcFromText('')).toBeNull();
  });

  it('strips spaces from prefixed digits', () => {
    expect(extractUpcFromText('UPC: 717 524 611 109')).toBe('717524611109');
  });
});

describe('SCANNED_BARCODE_PREFIX', () => {
  it('has expected value', () => {
    expect(SCANNED_BARCODE_PREFIX).toBe('Scanned barcode:');
  });
});

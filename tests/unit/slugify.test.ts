import { describe, expect, it } from 'vitest';
import { slugify } from '@/lib/slugify';

describe('slugify', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(slugify('Intro To React')).toBe('intro-to-react');
  });

  it('collapses non-alphanumeric runs into a single hyphen', () => {
    expect(slugify('C++ & Data Structures!!')).toBe('c-data-structures');
  });

  it('trims leading/trailing hyphens', () => {
    expect(slugify('  --Weird Title--  ')).toBe('weird-title');
  });
});

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  colorFingerprint,
  colorSimilarity,
  normalizeStr,
} = require('../services/DuplicateDetectionService');

describe('DuplicateDetectionService', () => {
  test('normalizeStr trims and lowers case', () => {
    assert.equal(normalizeStr('  F-1  Red  '), 'f-1 red');
    assert.equal(normalizeStr('White BEAM'), 'white beam');
    assert.equal(normalizeStr(null), '');
  });

  test('colorFingerprint creates order-independent stable fingerprints', () => {
    const list1 = [
      { f_number: 'F-1', color_name: 'Red', company_name: 'Mill A' },
      { f_number: 'F-2', color_name: 'Green', company_name: 'Mill B' },
    ];
    const list2 = [
      { f_number: 'F-2', color_name: 'Green', company_name: 'Mill B' },
      { f_number: 'F-1', color_name: 'Red', company_name: 'Mill A' },
    ];

    assert.equal(colorFingerprint(list1), colorFingerprint(list2));
  });

  test('colorSimilarity computes accurate percentage overlaps', () => {
    const setA = [
      { f_number: 'F-1', color_name: 'Red', company_name: '' },
      { f_number: 'F-2', color_name: 'Green', company_name: '' },
    ];
    const setB = [
      { f_number: 'F-1', color_name: 'Red', company_name: '' },
      { f_number: 'F-2', color_name: 'Green', company_name: '' },
    ];
    const setC = [
      { f_number: 'F-3', color_name: 'Blue', company_name: '' },
    ];

    assert.equal(colorSimilarity(setA, setB), 100);
    assert.equal(colorSimilarity(setA, setC), 0);
  });
});

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const ShopParser = require('../services/parser/ShopParser');
const NoiseFilter = require('../services/parser/NoiseFilter');
const SeriesParser = require('../services/parser/SeriesParser');
const { parseMessage } = require('../services/parser/WhatsAppParserEngine');

describe('ShopParser', () => {
  test('detects bare KP and KPR markers', () => {
    assert.deepEqual(ShopParser.parse('KP'), { brand: 'KP' });
    assert.deepEqual(ShopParser.parse('kp'), { brand: 'KP' });
    assert.deepEqual(ShopParser.parse('KPR'), { brand: 'KPR' });
    assert.deepEqual(ShopParser.parse('Shop: KP'), { brand: 'KP' });
    assert.deepEqual(ShopParser.parse('Shop - KPR'), { brand: 'KPR' });
  });

  test('does not misidentify series codes starting with KP as shop markers', () => {
    assert.equal(ShopParser.parse('KP450A'), null);
    assert.equal(ShopParser.parse('KP1001'), null);
    assert.equal(ShopParser.parse('KS526F'), null);
  });
});

describe('NoiseFilter', () => {
  test('identifies timestamps, dates and chat headers as noise', () => {
    assert.equal(NoiseFilter.isNoise('12:34 PM'), true);
    assert.equal(NoiseFilter.isNoise('11:20 am'), true);
    assert.equal(NoiseFilter.isNoise('12/03/2024'), true);
    assert.equal(NoiseFilter.isNoise('2024-01-15'), true);
    assert.equal(NoiseFilter.isNoise('+91 98765 43210'), true);
    assert.equal(NoiseFilter.isNoise('Forwarded'), true);
    assert.equal(NoiseFilter.isNoise('----------------'), true);
  });

  test('preserves valid inventory codes and color lines', () => {
    assert.equal(NoiseFilter.isNoise('KS526F'), false);
    assert.equal(NoiseFilter.isNoise('White Beam'), false);
    assert.equal(NoiseFilter.isNoise('F-1 Red 25'), false);
    assert.equal(NoiseFilter.isNoise('F-2 Rama Green 15'), false);
  });
});

describe('SeriesParser', () => {
  test('extracts series base, letter, and combination name', () => {
    const result1 = SeriesParser.parse('KS526F (Urgent Delivery)');
    assert.ok(result1);
    assert.equal(result1.series_code, 'KS526F');
    assert.equal(result1.series_base, 'KS526');
    assert.equal(result1.series_letter, 'F');
    assert.equal(result1.combination_name, 'Urgent Delivery');

    const result2 = SeriesParser.parse('KP450A');
    assert.ok(result2);
    assert.equal(result2.series_code, 'KP450A');
    assert.equal(result2.series_base, 'KP450');
    assert.equal(result2.series_letter, 'A');
    assert.equal(result2.combination_name, null);
  });
});

describe('WhatsAppParserEngine', () => {
  test('parses multi-shop batch message with beam and itemized F-colors', () => {
    const chat = `
KP
KS526F
White Beam
F-1 Red
F-2 Rama Green
25 pcs

KPR
KP1001A
Black Beam
F-1 Yellow
F-3 Rani Pink
50 pcs
    `.trim();

    const result = parseMessage(chat, 'KP');
    assert.equal(result.totalParsed, 2);
    assert.deepEqual(result.shopsDetected, ['KP', 'KPR']);

    const entry1 = result.entries[0];
    assert.equal(entry1.brand, 'KP');
    assert.equal(entry1.series_code, 'KS526F');
    assert.equal(entry1.beam_name, 'White Beam');
    assert.equal(entry1.stock, 25);
    assert.equal(entry1.colors.length, 2);
    assert.equal(entry1.colors[0].f_number, 'F-1');
    assert.equal(entry1.colors[0].color_name, 'Red');

    const entry2 = result.entries[1];
    assert.equal(entry2.brand, 'KPR');
    assert.equal(entry2.series_code, 'KP1001A');
    assert.equal(entry2.beam_name, 'Black Beam');
    assert.equal(entry2.stock, 50);
    assert.equal(entry2.colors.length, 2);
  });

  test('flags duplicate entries within the same message', () => {
    const duplicateChat = `
KP
KS526F
F-1 Red 25

KP
KS526F
F-1 Red 25
    `.trim();

    const result = parseMessage(duplicateChat, 'KP');
    assert.equal(result.totalParsed, 2);
    assert.equal(result.duplicateCount, 1);
    assert.equal(result.entries[1].duplicate_in_message, true);
  });
});

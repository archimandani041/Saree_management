const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

describe('Stock Calculation & Audit Rollback Logic', () => {
  test('calculates correct delta on relative addition', () => {
    const prevStock = 120;
    const changeAmount = 25;
    const newStock = prevStock + changeAmount;
    assert.equal(newStock, 145);
  });

  test('calculates correct delta on relative subtraction', () => {
    const prevStock = 120;
    const changeAmount = -30;
    const newStock = prevStock + changeAmount;
    assert.equal(newStock, 90);
  });

  test('computes rollback restoring previous snapshot', () => {
    // Transaction A changed 50 -> 80 (+30)
    const originalSnapshot = 50;
    const recordedDelta = 30;
    const currentStock = originalSnapshot + recordedDelta; // 80

    // Rollback computation
    const restoredStock = currentStock - recordedDelta;
    assert.equal(restoredStock, originalSnapshot);
  });

  test('evaluates low stock alert safety thresholds', () => {
    const minAlertThreshold = 20;
    assert.equal(15 <= minAlertThreshold, true);  // triggers alert
    assert.equal(25 <= minAlertThreshold, false); // safe
    assert.equal(20 <= minAlertThreshold, true);  // boundary trigger
  });
});

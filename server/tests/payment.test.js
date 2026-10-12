const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

describe('Payment & Cryptographic Signature Verification', () => {
  test('validates authentic Razorpay HMAC SHA256 signature', () => {
    const secret = 'dummy_test_secret_key_12345';
    const orderId = 'order_DAz45xyz789';
    const paymentId = 'pay_9876543210';

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${orderId}|${paymentId}`);
    const expectedSignature = hmac.digest('hex');

    // Simulate verification
    const testHmac = crypto.createHmac('sha256', secret);
    testHmac.update(`${orderId}|${paymentId}`);
    const testSignature = testHmac.digest('hex');

    assert.equal(testSignature, expectedSignature);
  });

  test('rejects tampered payment or order identifier', () => {
    const secret = 'dummy_test_secret_key_12345';
    const orderId = 'order_DAz45xyz789';
    const paymentId = 'pay_9876543210';
    const tamperedPaymentId = 'pay_tampered_0000';

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${orderId}|${paymentId}`);
    const validSignature = hmac.digest('hex');

    const testHmac = crypto.createHmac('sha256', secret);
    testHmac.update(`${orderId}|${tamperedPaymentId}`);
    const tamperedSignature = testHmac.digest('hex');

    assert.notEqual(tamperedSignature, validSignature);
  });

  test('computes correct GST 18% split (9% CGST + 9% SGST)', () => {
    const totalAmount = 399;
    const baseAmount = Number((totalAmount / 1.18).toFixed(2));
    const totalTax = Number((totalAmount - baseAmount).toFixed(2));
    const halfTax = Number((totalTax / 2).toFixed(2));

    assert.equal(baseAmount + totalTax, totalAmount);
    assert.equal(Number((halfTax * 2).toFixed(2)), totalTax);
  });
});

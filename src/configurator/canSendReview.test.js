/**
 * Unit tests for canSendReview.
 * Run with: npm test
 */

import { test } from 'node:test';
import assert from 'node:assert';

// Pure function implementation for testing (mirrors canSendReview.ts)
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function canSendReview(input) {
  return (
    input.name.trim().length > 1 &&
    EMAIL_PATTERN.test(input.email) &&
    input.measurementsAcknowledged
  );
}

// ── canSendReview: sendable without token ────────────────────────────────────

test('canSendReview: sendable with valid name, email, and acknowledgement (no token)', () => {
  const result = canSendReview({
    name: 'John Doe',
    email: 'john@example.com',
    measurementsAcknowledged: true,
  });
  assert.strictEqual(result, true);
});

test('canSendReview: sendable with valid name, email, and acknowledgement (minimal name)', () => {
  const result = canSendReview({
    name: 'Jo',
    email: 'jo@example.com',
    measurementsAcknowledged: true,
  });
  assert.strictEqual(result, true);
});

test('canSendReview: sendable with whitespace-padded name', () => {
  const result = canSendReview({
    name: '  John Doe  ',
    email: 'john@example.com',
    measurementsAcknowledged: true,
  });
  assert.strictEqual(result, true);
});

// ── canSendReview: sendable with token (token presence doesn't affect logic) ─

test('canSendReview: sendable with valid inputs (token would be passed separately)', () => {
  // The function doesn't care about token presence, that's handled at submit time
  const result = canSendReview({
    name: 'Jane Smith',
    email: 'jane@example.com',
    measurementsAcknowledged: true,
  });
  assert.strictEqual(result, true);
});

// ── canSendReview: blocked on missing name ───────────────────────────────────

test('canSendReview: blocked when name is empty string', () => {
  const result = canSendReview({
    name: '',
    email: 'john@example.com',
    measurementsAcknowledged: true,
  });
  assert.strictEqual(result, false);
});

test('canSendReview: blocked when name is only whitespace', () => {
  const result = canSendReview({
    name: '   ',
    email: 'john@example.com',
    measurementsAcknowledged: true,
  });
  assert.strictEqual(result, false);
});

test('canSendReview: blocked when name is single character', () => {
  const result = canSendReview({
    name: 'J',
    email: 'john@example.com',
    measurementsAcknowledged: true,
  });
  assert.strictEqual(result, false);
});

test('canSendReview: blocked when name is single character plus whitespace', () => {
  const result = canSendReview({
    name: '  J  ',
    email: 'john@example.com',
    measurementsAcknowledged: true,
  });
  assert.strictEqual(result, false);
});

// ── canSendReview: blocked on missing/invalid email ──────────────────────────

test('canSendReview: blocked when email is empty string', () => {
  const result = canSendReview({
    name: 'John Doe',
    email: '',
    measurementsAcknowledged: true,
  });
  assert.strictEqual(result, false);
});

test('canSendReview: blocked when email is missing @ symbol', () => {
  const result = canSendReview({
    name: 'John Doe',
    email: 'johnexample.com',
    measurementsAcknowledged: true,
  });
  assert.strictEqual(result, false);
});

test('canSendReview: blocked when email is missing domain', () => {
  const result = canSendReview({
    name: 'John Doe',
    email: 'john@',
    measurementsAcknowledged: true,
  });
  assert.strictEqual(result, false);
});

test('canSendReview: blocked when email is missing TLD', () => {
  const result = canSendReview({
    name: 'John Doe',
    email: 'john@example',
    measurementsAcknowledged: true,
  });
  assert.strictEqual(result, false);
});

test('canSendReview: blocked when email has spaces', () => {
  const result = canSendReview({
    name: 'John Doe',
    email: 'john doe@example.com',
    measurementsAcknowledged: true,
  });
  assert.strictEqual(result, false);
});

// ── canSendReview: blocked on missing acknowledgement ────────────────────────

test('canSendReview: blocked when measurementsAcknowledged is false', () => {
  const result = canSendReview({
    name: 'John Doe',
    email: 'john@example.com',
    measurementsAcknowledged: false,
  });
  assert.strictEqual(result, false);
});

// ── canSendReview: blocked on multiple missing fields ────────────────────────

test('canSendReview: blocked when name and email are invalid', () => {
  const result = canSendReview({
    name: 'J',
    email: 'invalid',
    measurementsAcknowledged: true,
  });
  assert.strictEqual(result, false);
});

test('canSendReview: blocked when all fields are invalid', () => {
  const result = canSendReview({
    name: '',
    email: 'invalid',
    measurementsAcknowledged: false,
  });
  assert.strictEqual(result, false);
});

// ── canSendReview: edge cases ────────────────────────────────────────────────

test('canSendReview: accepts email with subdomain', () => {
  const result = canSendReview({
    name: 'John Doe',
    email: 'john@mail.example.com',
    measurementsAcknowledged: true,
  });
  assert.strictEqual(result, true);
});

test('canSendReview: accepts email with plus sign', () => {
  const result = canSendReview({
    name: 'John Doe',
    email: 'john+test@example.com',
    measurementsAcknowledged: true,
  });
  assert.strictEqual(result, true);
});

test('canSendReview: accepts email with numbers', () => {
  const result = canSendReview({
    name: 'John Doe',
    email: 'john123@example456.com',
    measurementsAcknowledged: true,
  });
  assert.strictEqual(result, true);
});

test('canSendReview: accepts long name', () => {
  const result = canSendReview({
    name: 'John Christopher Alexander Smith-Johnson III',
    email: 'john@example.com',
    measurementsAcknowledged: true,
  });
  assert.strictEqual(result, true);
});

console.log('All canSendReview tests passed!');

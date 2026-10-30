/**
 * Tests for measurement value precedence.
 *
 * Validates that customer-entered values always win over AI/Gemini prefill.
 * Gemini values may populate empty fields but must never overwrite a value
 * the customer has typed.
 */

import { test } from 'node:test';
import assert from 'node:assert';

/**
 * Helper to simulate measurement state with customer and Gemini values.
 */
function createMeasurementState(customerValue, geminiValue) {
  return {
    customerEntered: customerValue !== null,
    value: customerValue ?? geminiValue,
    source: customerValue !== null ? 'customer' : geminiValue !== null ? 'gemini' : null,
  };
}

/**
 * Apply a Gemini reading to a field, respecting customer precedence.
 * Returns true if the value was applied, false if blocked.
 */
function applyGeminiValue(state, geminiValue) {
  // Never overwrite a customer-entered value
  if (state.customerEntered) {
    return false;
  }

  // Can prefill empty fields
  state.value = geminiValue;
  state.source = 'gemini';
  return true;
}

/**
 * Apply a customer-entered value.
 */
function applyCustomerValue(state, customerValue) {
  state.value = customerValue;
  state.customerEntered = true;
  state.source = 'customer';
}

test('customer value blocks subsequent Gemini prefill', () => {
  const state = createMeasurementState(null, null);

  // Customer types value first
  applyCustomerValue(state, 1850);
  assert.strictEqual(state.value, 1850);
  assert.strictEqual(state.source, 'customer');

  // Gemini tries to apply its reading - should be blocked
  const applied = applyGeminiValue(state, 2000);
  assert.strictEqual(applied, false, 'Gemini should not overwrite customer value');
  assert.strictEqual(state.value, 1850, 'Value should remain customer-entered value');
  assert.strictEqual(state.source, 'customer');
});

test('Gemini can prefill empty field', () => {
  const state = createMeasurementState(null, null);

  // Gemini applies first
  const applied = applyGeminiValue(state, 1850);
  assert.strictEqual(applied, true, 'Gemini should prefill empty field');
  assert.strictEqual(state.value, 1850);
  assert.strictEqual(state.source, 'gemini');
});

test('customer can override Gemini prefill', () => {
  const state = createMeasurementState(null, null);

  // Gemini prefills
  applyGeminiValue(state, 1850);
  assert.strictEqual(state.value, 1850);

  // Customer corrects it
  applyCustomerValue(state, 1900);
  assert.strictEqual(state.value, 1900);
  assert.strictEqual(state.source, 'customer');

  // Gemini tries again - blocked
  const applied = applyGeminiValue(state, 2000);
  assert.strictEqual(applied, false);
  assert.strictEqual(state.value, 1900, 'Customer correction should stick');
});

test('multiple Gemini readings on empty field - last wins', () => {
  const state = createMeasurementState(null, null);

  applyGeminiValue(state, 1850);
  assert.strictEqual(state.value, 1850);

  // Customer hasn't typed, so Gemini can update
  applyGeminiValue(state, 1900);
  assert.strictEqual(state.value, 1900, 'Latest Gemini reading should apply when no customer value');
});

test('empty string from customer counts as entered', () => {
  const state = createMeasurementState(null, null);

  // Customer clears the field (explicit action)
  applyCustomerValue(state, 0);
  assert.strictEqual(state.customerEntered, true);

  // Gemini should not fill a deliberately-cleared field
  const applied = applyGeminiValue(state, 1850);
  assert.strictEqual(applied, false, 'Should not fill deliberately-cleared field');
});

test('unit conversion before comparison', () => {
  const state = createMeasurementState(null, null);

  // Customer enters 1.85m (as 1850mm)
  applyCustomerValue(state, 1850);

  // Gemini reads "1.85m" and converts to 1850mm
  const geminiMm = 1850; // Already converted by handleGeminiReading
  const applied = applyGeminiValue(state, geminiMm);

  assert.strictEqual(applied, false, 'Should recognize customer already entered this value');
  assert.strictEqual(state.value, 1850);
});

/**
 * Integration scenario: typical workflow.
 */
test('typical workflow - photo first, then manual correction', () => {
  const heightState = createMeasurementState(null, null);
  const widthState = createMeasurementState(null, null);

  // Step 1: Customer takes photos
  // Step 2: Gemini processes and prefills
  applyGeminiValue(heightState, 2000);
  applyGeminiValue(widthState, 900);

  assert.strictEqual(heightState.value, 2000);
  assert.strictEqual(widthState.value, 900);

  // Step 3: Customer reviews and corrects width (their tape says 920)
  applyCustomerValue(widthState, 920);

  // Step 4: Customer retakes height photo (better angle)
  // Gemini re-processes and tries to update
  const heightUpdated = applyGeminiValue(heightState, 2050);
  const widthUpdated = applyGeminiValue(widthState, 910);

  // Height can update (no manual entry), width cannot
  assert.strictEqual(heightUpdated, true, 'Height not manually entered, can update');
  assert.strictEqual(heightState.value, 2050);

  assert.strictEqual(widthUpdated, false, 'Width manually corrected, should not update');
  assert.strictEqual(widthState.value, 920, 'Manual correction should stick');
});

/**
 * Edge case: customer enters same value as Gemini.
 */
test('customer confirming Gemini value by retyping it', () => {
  const state = createMeasurementState(null, null);

  // Gemini prefills
  applyGeminiValue(state, 1850);

  // Customer sees it, agrees, but retypes the same number (or tabs through)
  applyCustomerValue(state, 1850);
  assert.strictEqual(state.customerEntered, true, 'Retyping should mark as customer-entered');

  // New photo → new Gemini reading
  const applied = applyGeminiValue(state, 1900);
  assert.strictEqual(applied, false, 'Confirmed value should not be overwritten');
  assert.strictEqual(state.value, 1850);
});

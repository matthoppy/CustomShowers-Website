/**
 * Unit tests for Gemini photo recognition functions.
 * Run with: node design-worker/worker.test.js
 */

import { test } from "node:test";
import assert from "node:assert";
import { validateGeminiImages, parseGeminiResponse, clampConfidence } from "./worker.js";

// ── clampConfidence ──────────────────────────────────────────────────────────

test("clampConfidence: clamps values below 0", () => {
  assert.strictEqual(clampConfidence(-0.5), 0);
  assert.strictEqual(clampConfidence(-100), 0);
});

test("clampConfidence: clamps values above 1", () => {
  assert.strictEqual(clampConfidence(1.5), 1);
  assert.strictEqual(clampConfidence(100), 1);
});

test("clampConfidence: preserves values in range", () => {
  assert.strictEqual(clampConfidence(0), 0);
  assert.strictEqual(clampConfidence(0.5), 0.5);
  assert.strictEqual(clampConfidence(1), 1);
});

test("clampConfidence: handles non-number inputs", () => {
  assert.strictEqual(clampConfidence(null), 0);
  assert.strictEqual(clampConfidence(undefined), 0);
  assert.strictEqual(clampConfidence("0.5"), 0);
  assert.strictEqual(clampConfidence(NaN), 0);
});

// ── validateGeminiImages ─────────────────────────────────────────────────────

test("validateGeminiImages: rejects non-array input", () => {
  const result = validateGeminiImages(null);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("must be an array")));
});

test("validateGeminiImages: rejects empty array", () => {
  const result = validateGeminiImages([]);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("at least one image")));
});

test("validateGeminiImages: rejects too many images", () => {
  const images = Array(5).fill({ mimeType: "image/jpeg", data: "base64data" });
  const result = validateGeminiImages(images);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("maximum 4 images")));
});

test("validateGeminiImages: rejects invalid mime types", () => {
  const result = validateGeminiImages([
    { mimeType: "image/gif", data: "base64data" },
  ]);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("mimeType must be one of")));
});

test("validateGeminiImages: rejects missing mimeType", () => {
  const result = validateGeminiImages([{ data: "base64data" }]);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("mimeType is required")));
});

test("validateGeminiImages: rejects missing data", () => {
  const result = validateGeminiImages([{ mimeType: "image/jpeg" }]);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("data (base64) is required")));
});

test("validateGeminiImages: rejects oversized images", () => {
  // 5MB limit means base64 string of length ~6.67M (5MB * 4/3)
  // Create a string that represents > 5MB when decoded
  const largeData = "A".repeat(7 * 1024 * 1024); // 7M chars = ~5.25MB decoded
  const result = validateGeminiImages([
    { mimeType: "image/jpeg", data: largeData },
  ]);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("exceeds") && e.includes("bytes limit")));
});

test("validateGeminiImages: accepts valid images", () => {
  const result = validateGeminiImages([
    { mimeType: "image/jpeg", data: "base64data" },
    { mimeType: "image/png", data: "base64data" },
    { mimeType: "image/webp", data: "base64data" },
  ]);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.errors.length, 0);
});

test("validateGeminiImages: accepts all allowed mime types", () => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
  const images = allowedTypes.map((mimeType) => ({ mimeType, data: "base64data" }));
  const result = validateGeminiImages(images);
  assert.strictEqual(result.valid, false); // 5 images is too many
  assert.ok(result.errors.some((e) => e.includes("maximum 4 images")));

  // Test with 4 images
  const validImages = images.slice(0, 4);
  const validResult = validateGeminiImages(validImages);
  assert.strictEqual(validResult.valid, true);
});

// ── parseGeminiResponse ──────────────────────────────────────────────────────

test("parseGeminiResponse: rejects null response", () => {
  const result = parseGeminiResponse(null, "analyse");
  assert.strictEqual(result.valid, false);
  assert.ok(result.error.includes("Invalid response format"));
});

test("parseGeminiResponse: rejects response without candidates", () => {
  const result = parseGeminiResponse({}, "analyse");
  assert.strictEqual(result.valid, false);
  assert.ok(result.error.includes("No candidates"));
});

test("parseGeminiResponse: rejects response without content", () => {
  const result = parseGeminiResponse(
    { candidates: [{ content: { parts: [] } }] },
    "analyse"
  );
  assert.strictEqual(result.valid, false);
  assert.ok(result.error.includes("No text content"));
});

test("parseGeminiResponse: rejects malformed JSON", () => {
  const result = parseGeminiResponse(
    {
      candidates: [
        {
          content: {
            parts: [{ text: "not valid json {" }],
          },
        },
      ],
    },
    "analyse"
  );
  assert.strictEqual(result.valid, false);
  assert.ok(result.error.includes("not valid JSON"));
});

test("parseGeminiResponse: rejects analyse response without readings array", () => {
  const result = parseGeminiResponse(
    {
      candidates: [
        {
          content: {
            parts: [{ text: JSON.stringify({ notes: "test" }) }],
          },
        },
      ],
    },
    "analyse"
  );
  assert.strictEqual(result.valid, false);
  assert.ok(result.error.includes("readings must be an array"));
});

test("parseGeminiResponse: validates and clamps confidence in analyse response", () => {
  const response = {
    candidates: [
      {
        content: {
          parts: [
            {
              text: JSON.stringify({
                readings: [
                  { value: 1850, unit: "mm", confidence: 1.5, source: "tape" },
                  { value: 900, unit: "mm", confidence: -0.2, source: "laser" },
                  { value: 10, unit: "mm", confidence: "invalid", source: "plumb" },
                ],
                notes: "Good visibility",
              }),
            },
          ],
        },
      },
    ],
  };

  const result = parseGeminiResponse(response, "analyse");
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.data.readings.length, 3);
  assert.strictEqual(result.data.readings[0].confidence, 1); // clamped from 1.5
  assert.strictEqual(result.data.readings[1].confidence, 0); // clamped from -0.2
  assert.strictEqual(result.data.readings[2].confidence, 0); // invalid -> 0
});

test("parseGeminiResponse: handles missing fields gracefully in analyse response", () => {
  const response = {
    candidates: [
      {
        content: {
          parts: [
            {
              text: JSON.stringify({
                readings: [
                  { value: 1850, unit: "mm", confidence: 0.9, source: "tape" },
                  { unit: "mm", confidence: 0.8, source: "partial" }, // missing value
                ],
                notes: "Some issues",
              }),
            },
          ],
        },
      },
    ],
  };

  const result = parseGeminiResponse(response, "analyse");
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.data.readings[0].value, 1850);
  assert.strictEqual(result.data.readings[1].value, null); // missing -> null
});

test("parseGeminiResponse: accepts valid analyse response", () => {
  const response = {
    candidates: [
      {
        content: {
          parts: [
            {
              text: JSON.stringify({
                readings: [
                  { value: 1850, unit: "mm", confidence: 0.95, source: "tape measure" },
                  { value: 900, unit: "mm", confidence: 0.8, source: "laser" },
                ],
                notes: "Clear measurements",
              }),
            },
          ],
        },
      },
    ],
  };

  const result = parseGeminiResponse(response, "analyse");
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.data.readings.length, 2);
  assert.strictEqual(result.data.readings[0].value, 1850);
  assert.strictEqual(result.data.readings[0].confidence, 0.95);
  assert.strictEqual(result.data.notes, "Clear measurements");
});

test("parseGeminiResponse: accepts valid suggest response", () => {
  const response = {
    candidates: [
      {
        content: {
          parts: [
            {
              text: JSON.stringify({
                config: {
                  panelCount: 3,
                  mounting: "wall-to-wall",
                  finish: "chrome",
                  heightMm: 2000,
                },
                notes: "Suitable for standard alcove",
              }),
            },
          ],
        },
      },
    ],
  };

  const result = parseGeminiResponse(response, "suggest");
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.data.config.panelCount, 3);
  assert.strictEqual(result.data.config.mounting, "wall-to-wall");
  assert.strictEqual(result.data.notes, "Suitable for standard alcove");
});

test("parseGeminiResponse: handles empty config in suggest response", () => {
  const response = {
    candidates: [
      {
        content: {
          parts: [
            {
              text: JSON.stringify({
                notes: "Cannot determine configuration from photo",
              }),
            },
          ],
        },
      },
    ],
  };

  const result = parseGeminiResponse(response, "suggest");
  assert.strictEqual(result.valid, true);
  assert.deepStrictEqual(result.data.config, {});
  assert.strictEqual(result.data.notes, "Cannot determine configuration from photo");
});

test("parseGeminiResponse: handles missing notes field", () => {
  const response = {
    candidates: [
      {
        content: {
          parts: [
            {
              text: JSON.stringify({
                readings: [],
              }),
            },
          ],
        },
      },
    ],
  };

  const result = parseGeminiResponse(response, "analyse");
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.data.notes, "");
});

test("parseGeminiResponse: rejects unknown response type", () => {
  const response = {
    candidates: [
      {
        content: {
          parts: [{ text: JSON.stringify({ readings: [] }) }],
        },
      },
    ],
  };

  const result = parseGeminiResponse(response, "unknown");
  assert.strictEqual(result.valid, false);
  assert.ok(result.error.includes("Unknown response type"));
});

console.log("All tests passed!");

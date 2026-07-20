import { test } from 'node:test';
import assert from 'node:assert/strict';

import { toGeminiHistory } from '../src/services/chatbot/chatbot.service.js';

test('accepts DB rows shaped { role, content }', () => {
  const out = toGeminiHistory([
    { role: 'user', content: 'hi' },
    { role: 'assistant', content: 'hello' },
  ]);
  assert.deepEqual(out, [
    { role: 'user', parts: [{ text: 'hi' }] },
    { role: 'model', parts: [{ text: 'hello' }] },
  ]);
});

test('maps assistant → model (Gemini role name)', () => {
  const out = toGeminiHistory([
    { role: 'user', content: 'a' },
    { role: 'assistant', content: 'b' },
  ]);
  assert.equal(out[1].role, 'model');
});

test('drops leading assistant turns — Gemini history must start with user', () => {
  const out = toGeminiHistory([
    { role: 'assistant', content: 'stale greeting' },
    { role: 'user', content: 'real question' },
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].role, 'user');
  assert.equal(out[0].parts[0].text, 'real question');
});

test('returns empty when there is no user turn at all', () => {
  const out = toGeminiHistory([
    { role: 'assistant', content: 'only assistant' },
  ]);
  assert.deepEqual(out, []);
});

test('skips blank and malformed rows', () => {
  const out = toGeminiHistory([
    { role: 'user', content: '   ' },
    null,
    { role: 'user' },
    { role: 'user', content: 'valid' },
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].parts[0].text, 'valid');
});

test('handles empty / non-array input safely', () => {
  assert.deepEqual(toGeminiHistory([]), []);
  assert.deepEqual(toGeminiHistory(undefined), []);
  assert.deepEqual(toGeminiHistory(null), []);
});

test('caps the replayed history length', () => {
  const many = Array.from({ length: 60 }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `m${i}`,
  }));
  const out = toGeminiHistory(many);
  assert.ok(out.length <= 20, `expected <= 20, got ${out.length}`);
  // Keeps the most recent turns, not the oldest.
  assert.equal(out.at(-1).parts[0].text, 'm59');
});

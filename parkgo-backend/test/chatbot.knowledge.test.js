import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildSystemPrompt } from '../src/services/chatbot/chatbot.knowledge.js';
import { BUSINESS, PRICING } from '../src/config/constants.js';

test('system prompt injects business rules from config', () => {
  const p = buildSystemPrompt('subscriber');
  assert.ok(p.includes(String(BUSINESS.MAX_PARKING_HOURS)), 'max hours');
  assert.ok(p.includes(String(BUSINESS.MIN_RESERVATION_HOURS_AHEAD)), 'min ahead');
  assert.ok(p.includes(String(PRICING.HOURLY_RATE)), 'hourly rate');
  assert.ok(p.includes(String(PRICING.LATE_FINE)), 'late fine');
});

test('system prompt is role-aware', () => {
  const subP = buildSystemPrompt('subscriber');
  const mgrP = buildSystemPrompt('manager');
  assert.match(subP, /SUBSCRIBER/);
  assert.match(mgrP, /MANAGER/);
  // Manager prompt mentions reports; subscriber prompt does not describe managing reports.
  assert.match(mgrP, /reports/i);
});

test('system prompt includes navigation deep-links for the role', () => {
  const subP = buildSystemPrompt('subscriber');
  assert.ok(subP.includes('/subscriber/reserve'));
  const mgrP = buildSystemPrompt('manager');
  assert.ok(mgrP.includes('/manager/reports'));
});

test('system prompt personalises with the first name when provided', () => {
  const p = buildSystemPrompt('subscriber', { firstName: 'Dana' });
  assert.match(p, /Dana/);
});

test('bilingual instruction is present', () => {
  const p = buildSystemPrompt('subscriber');
  assert.match(p, /same language/i);
});

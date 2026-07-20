import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  toolDeclarations,
  runTool,
  _registry,
} from '../src/services/chatbot/chatbot.tools.js';

const sub = { id: 7, user_type: 'subscriber', email: 's@x.com' };
const att = { id: 8, user_type: 'attendant', email: 'a@x.com' };
const mgr = { id: 9, user_type: 'manager', email: 'm@x.com' };

const names = (role) => toolDeclarations(role).map((d) => d.name);

test('subscriber tools are exposed only to subscribers', () => {
  assert.ok(names('subscriber').includes('getMyActiveParking'));
  assert.ok(names('subscriber').includes('proposeReservation'));
  assert.ok(!names('attendant').includes('getMyActiveParking'));
  assert.ok(!names('manager').includes('proposeReservation'));
});

test('staff-only tools are scoped correctly', () => {
  assert.ok(names('attendant').includes('getActiveParkings'));
  assert.ok(names('manager').includes('getRevenueSummary'));
  assert.ok(!names('subscriber').includes('getActiveParkings'));
  assert.ok(!names('attendant').includes('getRevenueSummary'));
});

test('getFacilityStatus is available to all roles', () => {
  for (const r of ['subscriber', 'attendant', 'manager']) {
    assert.ok(names(r).includes('getFacilityStatus'), `missing for ${r}`);
  }
});

test('runTool refuses a tool the role may not use (no DB hit)', async () => {
  const res = await runTool('getRevenueSummary', {}, sub);
  assert.match(res.error, /not available for your role/i);
});

test('runTool rejects unknown tools', async () => {
  const res = await runTool('deleteEverything', {}, mgr);
  assert.match(res.error, /unknown tool/i);
});

test('proposeReservation returns a confirm-card action, does not mutate', async () => {
  const out = await _registry.proposeReservation.execute(
    { datetime: '2026-07-20T10:00:00.000Z' },
    sub
  );
  assert.equal(out.proposed, true);
  assert.deepEqual(out.__action, {
    type: 'reservation',
    params: { reservation_start: '2026-07-20T10:00:00.000Z' },
  });
});

test('proposeExtendParking defaults extra_minutes to 60', async () => {
  const out = await _registry.proposeExtendParking.execute(
    { parking_code: 123 },
    sub
  );
  assert.equal(out.__action.type, 'extend_parking');
  assert.equal(out.__action.params.parking_code, 123);
  assert.equal(out.__action.params.extra_minutes, 60);
});

test('proposeCancelReservation carries the reservation id', async () => {
  const out = await _registry.proposeCancelReservation.execute(
    { reservation_id: 55 },
    sub
  );
  assert.deepEqual(out.__action, {
    type: 'cancel_reservation',
    params: { reservation_id: 55 },
  });
});

// The role guard runs before execution, so attendant/manager can never reach a
// subscriber-only propose tool.
test('runTool blocks a subscriber action tool for staff', async () => {
  const res = await runTool('proposeReservation', { datetime: 'x' }, att);
  assert.match(res.error, /not available/i);
});

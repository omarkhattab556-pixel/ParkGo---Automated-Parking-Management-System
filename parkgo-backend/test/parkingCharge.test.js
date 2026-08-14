import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PRICING } from '../src/config/constants.js';
import { buildParkingCharge } from '../src/services/reports.service.js';

const baseParking = {
  parking_date: '2026-08-14T08:00:00.000Z',
  retrieval_time: '2026-08-14T09:01:00.000Z',
  max_time_minutes: 240,
};

test('charges every started hour using the shared pricing model', () => {
  const charge = buildParkingCharge(baseParking);

  assert.deepEqual(charge, {
    currency: PRICING.CURRENCY,
    parking_cost: PRICING.HOURLY_RATE * 2,
    late_fine: 0,
    total: PRICING.HOURLY_RATE * 2,
    is_estimate: false,
  });
});

test('adds the configured late fine to a completed parking charge', () => {
  const charge = buildParkingCharge({
    ...baseParking,
    retrieval_time: '2026-08-14T12:01:00.000Z',
  });
  const parkingCost = PRICING.HOURLY_RATE * 5;

  assert.equal(charge.parking_cost, parkingCost);
  assert.equal(charge.late_fine, PRICING.LATE_FINE);
  assert.equal(charge.total, parkingCost + PRICING.LATE_FINE);
  assert.equal(charge.is_estimate, false);
});

test('marks an active parking charge as an estimate at the supplied time', () => {
  const charge = buildParkingCharge(
    { ...baseParking, retrieval_time: null },
    new Date('2026-08-14T08:30:00.000Z')
  );

  assert.equal(charge.parking_cost, PRICING.HOURLY_RATE);
  assert.equal(charge.late_fine, 0);
  assert.equal(charge.total, PRICING.HOURLY_RATE);
  assert.equal(charge.is_estimate, true);
});

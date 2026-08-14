import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildActivityWindow,
  getRecentParkingActivity,
} from '../src/services/parkingActivity.service.js';

const NOW = new Date('2026-08-14T10:30:00.000Z');

const createCountingClient = (counts, errorColumn = null) => {
  const queries = [];

  return {
    queries,
    from(table) {
      return {
        select(selectedColumn, options) {
          return {
            gte(timestampColumn, from) {
              return {
                lte(upperColumn, to) {
                  queries.push({
                    table,
                    selectedColumn,
                    options,
                    timestampColumn,
                    upperColumn,
                    from,
                    to,
                  });

                  return Promise.resolve({
                    count: counts[timestampColumn] ?? 0,
                    error:
                      timestampColumn === errorColumn
                        ? new Error(`Failed to count ${timestampColumn}`)
                        : null,
                  });
                },
              };
            },
          };
        },
      };
    },
  };
};

test('builds an exact 30-minute activity window ending at the shared server time', () => {
  assert.deepEqual(buildActivityWindow(NOW), {
    windowMinutes: 30,
    from: '2026-08-14T10:00:00.000Z',
    to: '2026-08-14T10:30:00.000Z',
  });
});

test('counts entries and exits independently, including completed sessions', async () => {
  const client = createCountingClient({ parking_date: 4, retrieval_time: 3 });

  const result = await getRecentParkingActivity({
    supabaseClient: client,
    now: NOW,
  });

  assert.deepEqual(result, {
    window_minutes: 30,
    from: '2026-08-14T10:00:00.000Z',
    to: '2026-08-14T10:30:00.000Z',
    entries: 4,
    exits: 3,
    total: 7,
  });
  assert.deepEqual(
    client.queries.map((query) => query.timestampColumn).sort(),
    ['parking_date', 'retrieval_time']
  );
  for (const query of client.queries) {
    assert.equal(query.table, 'parking');
    assert.equal(query.selectedColumn, 'parking_code');
    assert.deepEqual(query.options, { count: 'exact', head: true });
    assert.equal(query.upperColumn, query.timestampColumn);
    assert.equal(query.from, result.from);
    assert.equal(query.to, result.to);
  }
});

test('propagates a database count failure instead of showing a false zero', async () => {
  const client = createCountingClient(
    { parking_date: 2, retrieval_time: 0 },
    'retrieval_time'
  );

  await assert.rejects(
    getRecentParkingActivity({ supabaseClient: client, now: NOW }),
    /Failed to count retrieval_time/
  );
});

import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateFinancialForecast } from './financialForecast.js';

test('calculates the next month forecast from pending income and expense records', () => {
  const now = new Date('2026-07-15T12:00:00.000Z');
  const records = [
    { type: 'income', amount: 1000, date: '2026-08-10T00:00:00.000Z', status: 'Pending' },
    { type: 'income', amount: 300, date: '2026-07-10T00:00:00.000Z', status: 'Pending' },
    { type: 'income', amount: 500, date: '2026-08-05T00:00:00.000Z', status: 'Completed' },
    { type: 'expense', amount: 200, date: '2026-08-12T00:00:00.000Z', status: 'Pending' },
    { type: 'expense', amount: 50, date: '2026-08-22T00:00:00.000Z', status: 'Cancelled' },
    { type: 'expense', amount: 75, date: '2026-09-01T00:00:00.000Z', status: 'Pending' },
  ];

  const result = calculateFinancialForecast(records, now);

  assert.equal(result.monthLabel, 'August 2026');
  assert.equal(result.expectedIncome, 1000);
  assert.equal(result.expectedExpenses, 200);
  assert.equal(result.balance, 800);
});

test('returns empty values when no pending forecast records exist for the upcoming month', () => {
  const now = new Date('2026-07-15T12:00:00.000Z');
  const records = [
    { type: 'income', amount: 100, date: '2026-07-10T00:00:00.000Z', status: 'Pending' },
    { type: 'expense', amount: 50, date: '2026-07-20T00:00:00.000Z', status: 'Pending' },
  ];

  const result = calculateFinancialForecast(records, now);

  assert.equal(result.expectedIncome, 0);
  assert.equal(result.expectedExpenses, 0);
  assert.equal(result.balance, 0);
  assert.equal(result.hasForecastData, false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCostingDetails } from '../utils/costingCalculator.js';

test('calculateCostingDetails evaluates 3 cost categories with fixed and percentage types correctly', () => {
  const costBreakdown = {
    materials: {
      gemstones: { type: 'fixed', value: 1000 },
      gold: { type: 'fixed', value: 500 },
    },
    production: {
      cad: { type: 'fixed', value: 200 },
      casting: { type: 'percentage', value: 10, basis: 'Material Cost' }, // 10% of $1500 = $150
    },
    other: {
      certificate: { type: 'fixed', value: 50 },
      marketing: { type: 'percentage', value: 5, basis: 'Selling Price' }, // 5% of $3000 = $150
      commission: { type: 'percentage', value: 10, basis: 'Gross Profit' }, // 10% of GP
    },
  };

  const result = calculateCostingDetails({
    costBreakdown,
    sellingPrice: 3000,
    charityPercentage: 20,
  });

  // Material cost: 1000 + 500 = 1500
  assert.equal(result.materialCost, 1500);

  // Production cost: 200 (cad) + 150 (casting 10% of mat) = 350
  assert.equal(result.productionCost, 350);

  // Base total cost before gross profit dependent items: 1500 + 350 + 50 (cert) + 150 (marketing 5% of 3000) = 2050
  // Initial Gross profit: 3000 - 2050 = 950
  // Commission: 10% of 950 = 95
  // Final other cost: 50 + 150 + 95 = 295
  assert.equal(result.otherCost, 295);

  // Total product cost: 1500 + 350 + 295 = 2145
  assert.equal(result.totalCost, 2145);

  // Gross profit: 3000 - 2145 = 855
  assert.equal(result.grossProfit, 855);

  // Charity (20% of GP): 855 * 0.20 = 171
  assert.equal(result.charityAmount, 171);

  // Net profit: 855 - 171 = 684
  assert.equal(result.netProfit, 684);
});

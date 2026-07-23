import test from "node:test";
import assert from "node:assert/strict";

test("Remaining Stock = Original Stock Quantity - Sold Quantity calculation logic", () => {
  let origQty = 10;
  let soldQty = 0;
  let currentQty = origQty - soldQty;

  assert.equal(currentQty, 10);
  assert.equal(soldQty, 0);

  // First sale of 3 units
  const sale1Qty = 3;
  soldQty += sale1Qty;
  currentQty = Math.max(0, origQty - soldQty);

  assert.equal(origQty, 10);
  assert.equal(soldQty, 3);
  assert.equal(currentQty, 7); // Remaining Stock = 10 - 3 = 7

  // Second sale of 7 units
  const sale2Qty = 7;
  soldQty += sale2Qty;
  currentQty = Math.max(0, origQty - soldQty);

  assert.equal(origQty, 10);
  assert.equal(soldQty, 10);
  assert.equal(currentQty, 0); // Remaining Stock = 10 - 10 = 0
});

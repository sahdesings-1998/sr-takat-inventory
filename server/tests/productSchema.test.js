import test from 'node:test';
import assert from 'node:assert/strict';

import Product from '../models/Product.js';

test('product schema avoids the reserved collection pathname', () => {
  assert.ok(Product.schema.path('productCollection'));
  assert.equal(Product.schema.path('collection'), undefined);
  assert.ok(Product.schema.virtualpath('collection'));
});

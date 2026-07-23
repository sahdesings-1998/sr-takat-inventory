import test from 'node:test';
import assert from 'node:assert/strict';

import reportService from '../services/reportService.js';
import Gemstone from '../models/Gemstone.js';
import Material from '../models/Material.js';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import Memo from '../models/Memo.js';
import JobCard from '../models/JobCard.js';
import Settings from '../models/Settings.js';

function createQueryResult(items) {
  const query = [...items];
  query.populate = function () {
    return this;
  };
  query.sort = function () {
    return this;
  };
  query.limit = function () {
    return this;
  };
  return query;
}

test('getDashboardSummary derives charity from configured percentage and memo counts from memo items', async () => {
  const originalGemstoneFind = Gemstone.find;
  const originalMaterialFind = Material.find;
  const originalProductFind = Product.find;
  const originalSaleFind = Sale.find;
  const originalMemoFind = Memo.find;
  const originalJobCardFind = JobCard.find;
  const originalSettingsGetSettings = Settings.getSettings;

  try {
    Gemstone.find = (query) => {
      if (query && query.status && query.status.$in) {
        return createQueryResult([
          { _id: 'g1', purchasePrice: 100, pieces: 2, gemstone: 'Ruby', stoneId: 'ST-1', certificateId: null, createdAt: new Date('2024-01-01'), status: 'In Stock' },
          { _id: 'g2', purchasePrice: 200, pieces: 1, gemstone: 'Diamond', stoneId: 'ST-2', certificateId: 'cert-1', createdAt: new Date('2024-02-01'), status: 'On Memo' },
        ]);
      }

      if (query && query.status === 'In Stock' && query.$or) {
        return createQueryResult([
          { _id: 'g1', purchasePrice: 100, pieces: 2, gemstone: 'Ruby', stoneId: 'ST-1', certificateId: null, createdAt: new Date('2024-01-01'), status: 'In Stock' },
        ]);
      }

      if (query && query.status === 'In Stock' && query.certificateId === null) {
        return createQueryResult([
          { _id: 'g1', purchasePrice: 100, pieces: 2, gemstone: 'Ruby', stoneId: 'ST-1', certificateId: null, createdAt: new Date('2024-01-01'), status: 'In Stock' },
        ]);
      }

      if (query && query.status === 'In Stock') {
        return createQueryResult([
          { _id: 'g3', purchasePrice: 300, pieces: 3, gemstone: 'Emerald', stoneId: 'ST-3', certificateId: 'cert-2', createdAt: new Date('2024-03-01'), status: 'In Stock' },
        ]);
      }

      return createQueryResult([]);
    };

    Material.find = () => createQueryResult([]);

    Product.find = (query) => {
      if (query && query.status && query.status.$in) {
        return createQueryResult([
          { _id: 'p1', category: 'Ring', name: 'Gold Ring', costPrice: 400, sellingPrice: 1000, status: 'In Stock', createdAt: new Date('2024-04-01') },
          { _id: 'p2', category: 'Watch', name: 'Leather Watch', costPrice: 300, sellingPrice: 800, status: 'On Memo', createdAt: new Date('2024-05-01') },
        ]);
      }

      if (query && query.status === 'In Stock') {
        return createQueryResult([
          { _id: 'p1', category: 'Ring', name: 'Gold Ring', costPrice: 400, sellingPrice: 1000, status: 'In Stock', createdAt: new Date('2024-04-01') },
        ]);
      }

      return createQueryResult([]);
    };

    Sale.find = () => createQueryResult([
      { _id: 's1', total: 1000, charityAmount: 0, grossProfit: 1000, netProfit: 800, paymentStatus: 'Paid' },
      { _id: 's2', total: 2000, charityAmount: 0, grossProfit: 900, netProfit: 720, paymentStatus: 'Paid' },
    ]);

    Memo.find = () => createQueryResult([
      {
        _id: 'm1',
        memoNo: 'MEM-1',
        customerId: { fullName: 'Alpha' },
        expectedReturn: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        status: 'With Client',
        items: [
          { status: 'On Memo', inventoryType: 'Gemstone', inventoryId: { purchasePrice: 100 }, quantity: 1 },
          { status: 'On Memo', inventoryType: 'Product', inventoryId: { sellingPrice: 500 }, quantity: 1 },
        ],
      },
      {
        _id: 'm2',
        memoNo: 'MEM-2',
        customerId: { fullName: 'Beta' },
        expectedReturn: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'Overdue',
        items: [
          { status: 'On Memo', inventoryType: 'Gemstone', inventoryId: { purchasePrice: 50 }, quantity: 2 },
        ],
      },
    ]);

    JobCard.find = (query) => {
      if (query && query.status && query.status.$in) {
        return createQueryResult([
          { _id: 'j1', jobNo: 'JOB-1', productId: { name: 'Ring' }, expectedDate: new Date('2024-06-01'), status: 'In Progress' },
        ]);
      }
      return createQueryResult([
        { _id: 'j1', jobNo: 'JOB-1', productId: { name: 'Ring' }, expectedDate: new Date('2024-06-01'), status: 'In Progress' },
        { _id: 'j2', jobNo: 'JOB-2', productId: { name: 'Watch' }, expectedDate: new Date('2024-06-02'), status: 'Completed' },
      ]);
    };

    Settings.getSettings = async () => ({ charityPercentage: 20 });

    const summary = await reportService.getDashboardSummary();

    assert.equal(summary.kpis.totalGemstones, 3);
    assert.equal(summary.kpis.jewelleryStock, 1);
    assert.equal(summary.kpis.watchStock, 1);
    assert.equal(summary.kpis.grossProfit, 1900);
    assert.equal(summary.kpis.charityAllocation, 380);
    assert.equal(summary.kpis.netProfit, 1520);
    assert.equal(summary.kpis.memoOnTime, 2);
    assert.equal(summary.kpis.memoOverdue, 2);
    assert.equal(summary.widgets.recentStock[0].name, 'Gold Ring');
    assert.equal(summary.widgets.lowStockOrMissingCert[0].stoneId, 'ST-1');
    assert.equal(summary.widgets.recentSales.length, 2);
    assert.equal(summary.widgets.pendingProduction.length, 1);
  } finally {
    Gemstone.find = originalGemstoneFind;
    Material.find = originalMaterialFind;
    Product.find = originalProductFind;
    Sale.find = originalSaleFind;
    Memo.find = originalMemoFind;
    JobCard.find = originalJobCardFind;
    Settings.getSettings = originalSettingsGetSettings;
  }
});

test('getProfitReport and getCharityReport calculate gross/net profit and 20% charity correctly', async () => {
  const originalSaleFind = Sale.find;
  const originalSettingsGetSettings = Settings.getSettings;

  try {
    Sale.find = () => createQueryResult([
      { _id: 's1', invoiceNo: 'INV-1001', total: 1000, grossProfit: 400, charityAmount: 80, netProfit: 320, paymentStatus: 'Paid', customerId: { fullName: 'Customer A' } },
      { _id: 's2', invoiceNo: 'INV-1002', total: 2000, grossProfit: 1000, charityAmount: 200, netProfit: 800, paymentStatus: 'Paid', customerId: { fullName: 'Customer B' } },
    ]);
    Settings.getSettings = async () => ({ charityPercentage: 20 });

    const profitData = await reportService.getProfitReport();
    assert.equal(profitData.length, 2);
    assert.equal(profitData[0].totalRevenue, 1000);
    assert.equal(profitData[0].cogs, 600);
    assert.equal(profitData[0].grossProfit, 400);
    assert.equal(profitData[0].charityAmount, 80);
    assert.equal(profitData[0].netProfit, 320);

    const charityData = await reportService.getCharityReport();
    assert.equal(charityData.length, 2);
    assert.equal(charityData[0].charityPercentage, 20);
    assert.equal(charityData[0].charityAmount, 80);
    assert.equal(charityData[1].charityAmount, 200);
  } finally {
    Sale.find = originalSaleFind;
    Settings.getSettings = originalSettingsGetSettings;
  }
});


import fs from 'fs';
import crypto from 'crypto';

const baseUrl = 'http://127.0.0.1:5000/api/v1';
const adminEmail = 'admin@example.com';
const adminPassword = 'password123';

async function request(url, options = {}) {
  const res = await fetch(url, options);
  const body = await res.text();
  let data;
  try { data = JSON.parse(body); } catch (err) { throw new Error(`Invalid JSON from ${url}: ${body}`); }
  if (!res.ok) {
    throw new Error(`Request failed ${res.status} ${url}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function login() {
  return request(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
}

async function getWithToken(url, token) {
  return request(url, { headers: { Authorization: `Bearer ${token}` } });
}

async function postWithToken(url, token, body) {
  return request(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function main() {
  const loginData = await login();
  const token = loginData.data.accessToken;
  const timestamp = Date.now();
  const unique = crypto.randomUUID();

  const dashBefore = await getWithToken(`${baseUrl}/reports/dashboard`, token);
  console.log('=== DASHBOARD BEFORE ===');
  console.log(JSON.stringify(dashBefore.data.kpis, null, 2));

  let customer = null;
  const customers = await getWithToken(`${baseUrl}/customers`, token);
  if (Array.isArray(customers.data) && customers.data.length > 0) {
    customer = customers.data[0];
  } else {
    const newCustomer = await postWithToken(`${baseUrl}/customers`, token, {
      fullName: 'Dashboard Test Customer',
      email: 'dashboard-test@example.com',
      phone: '+1 555 010 0101',
      address: '100 Test Lane',
      companyName: 'Dashboard Test LLC',
    });
    customer = newCustomer.data;
  }

  let suppliers = await getWithToken(`${baseUrl}/suppliers`, token);
  let supplierId;
  if (!Array.isArray(suppliers.data) || suppliers.data.length === 0) {
    const newSupplier = await postWithToken(`${baseUrl}/suppliers`, token, {
      companyName: 'Dashboard Test Supplier',
      contactName: 'Supply Admin',
      email: 'dashboard-supplier@example.com',
      phone: '+1 555 020 0202',
      address: '200 Supplier Way',
      status: 'active',
      notes: 'Created for dashboard sample data',
    });
    supplierId = newSupplier.data._id;
  } else {
    supplierId = suppliers.data[0]._id;
  }

  const stoneId = `GEM-DASH-${timestamp}-${unique}`;
  const stoneStockNo = `STK-GEM-DASH-${timestamp}-${unique}`;
  console.log('Creating gemstone with stoneId', stoneId);
  const gem = await postWithToken(`${baseUrl}/gemstones`, token, {
    stoneId,
    stockNo: stoneStockNo,
    gemstone: 'Dashboard Test Ruby',
    shape: 'Oval',
    carat: 2.1,
    pieces: 1,
    color: 'Deep Red',
    clarity: 'VS',
    origin: 'Mozambique',
    treatment: 'None',
    purchasePrice: 1400,
    costPerCarat: 666.67,
    supplierId,
    location: 'Dashboard Vault',
    status: 'In Stock',
  });
  console.log('Created gemstone', gem.data._id);

  const jewellery = await postWithToken(`${baseUrl}/products`, token, {
    productCode: `DASH-PRD-${timestamp}-${unique}-01`,
    stockNo: `STK-PRD-DASH-01-${timestamp}-${unique}`,
    name: 'Dashboard Test Bracelet',
    category: 'Bracelet',
    sellingPrice: 3100,
    costPrice: 2200,
    grossProfit: 900,
    charityAmount: 18,
    netProfit: 882,
    status: 'In Stock',
  });
  console.log('Created jewellery product', jewellery.data._id);

  const watch = await postWithToken(`${baseUrl}/products`, token, {
    productCode: `DASH-PRD-${timestamp}-${unique}-02`,
    stockNo: `STK-PRD-DASH-02-${timestamp}-${unique}`,
    name: 'Dashboard Test Watch',
    category: 'Watch',
    sellingPrice: 5200,
    costPrice: 3600,
    grossProfit: 1600,
    charityAmount: 32,
    netProfit: 1568,
    status: 'In Stock',
  });
  console.log('Created watch product', watch.data._id);

  const saleProduct = await postWithToken(`${baseUrl}/products`, token, {
    productCode: `DASH-PRD-${timestamp}-${unique}-03`,
    stockNo: `STK-PRD-DASH-03-${timestamp}-${unique}`,
    name: 'Dashboard Sale Product',
    category: 'Necklace',
    sellingPrice: 4200,
    costPrice: 3000,
    grossProfit: 1200,
    charityAmount: 24,
    netProfit: 1176,
    status: 'In Stock',
  });
  console.log('Created sale product', saleProduct.data._id);

  const sale = await postWithToken(`${baseUrl}/sales`, token, {
    customerId: customer._id,
    items: [
      {
        inventoryType: 'Product',
        inventoryId: saleProduct.data._id,
        quantity: 1,
        sellingPrice: 4200,
      },
    ],
    discount: 0,
    tax: 0,
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
  });
  console.log('Created sale', sale.data.sale._id);

  const memo = await postWithToken(`${baseUrl}/memos`, token, {
    customerId: customer._id,
    expectedReturn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        inventoryType: 'Product',
        inventoryId: watch.data._id,
        quantity: 1,
        carat: 0,
      },
    ],
    remarks: 'Test memo item for dashboard',
  });
  console.log('Created memo', memo.data._id);

  const jobCard = await postWithToken(`${baseUrl}/job-cards`, token, {
    productId: jewellery.data._id,
    assignedTo: loginData.data.user._id,
    expectedDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
  });
  console.log('Created job card', jobCard.data._id);

  const dashAfter = await getWithToken(`${baseUrl}/reports/dashboard`, token);
  console.log('=== DASHBOARD AFTER ===');
  console.log(JSON.stringify(dashAfter.data.kpis, null, 2));
  console.log('Recent sales count', dashAfter.data.widgets.recentSales.length);
  console.log('Pending production count', dashAfter.data.widgets.pendingProduction.length);
  console.log('Overdue memos count', dashAfter.data.widgets.overdueMemos.length);
  console.log('Low certificate count', dashAfter.data.widgets.lowStockOrMissingCert.length);
  console.log('Recent stock top item', dashAfter.data.widgets.recentStock[0]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

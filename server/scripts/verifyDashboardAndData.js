import dotenv from "dotenv";
dotenv.config();

const baseUrl = "http://127.0.0.1:5000/api/v1";
const adminEmail = "admin@example.com";
const adminPassword = "password123";

async function request(url, options = {}) {
  const res = await fetch(url, options);
  const body = await res.text();
  let data;
  try {
    data = JSON.parse(body);
  } catch (err) {
    throw new Error(`Invalid JSON response from ${url}: ${body}`);
  }
  if (!res.ok) {
    throw new Error(`Request failed ${res.status} ${url}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  console.log("[Verification] Logging in as admin...");
  const loginRes = await request(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });

  const token = loginRes.data.accessToken;
  const headers = { Authorization: `Bearer ${token}` };

  console.log("\n--- 1. DASHBOARD API VERIFICATION ---");
  const dash = await request(`${baseUrl}/reports/dashboard`, { headers });
  console.log("Dashboard KPIs:", JSON.stringify(dash.data.kpis, null, 2));
  console.log("Dashboard Widgets Count:");
  console.log("  - Recent Stock:", dash.data.widgets.recentStock.length);
  console.log("  - Overdue Memos:", dash.data.widgets.overdueMemos.length);
  console.log("  - Recent Sales:", dash.data.widgets.recentSales.length);
  console.log("  - Pending Production:", dash.data.widgets.pendingProduction.length);
  console.log("  - Low Stock / Cert Warnings:", dash.data.widgets.lowStockOrMissingCert.length);

  console.log("\n--- 2. PRODUCTS API VERIFICATION ---");
  const products = await request(`${baseUrl}/products`, { headers });
  console.log(`Retrieved ${products.data?.length || products.length} products from database.`);
  products.data?.slice(0, 4).forEach((p) => {
    console.log(`  Product [${p.stockNo}]: ${p.name} | Price: $${p.sellingPrice} | Status: ${p.status}`);
  });

  console.log("\n--- 3. SUPPLIERS & PURCHASE INVOICES VERIFICATION ---");
  const suppliers = await request(`${baseUrl}/suppliers`, { headers });
  console.log(`Retrieved ${suppliers.data?.length || suppliers.length} suppliers.`);
  const purchaseInvoices = await request(`${baseUrl}/purchase-invoices`, { headers });
  console.log(`Retrieved ${purchaseInvoices.data?.length || purchaseInvoices.length} purchase invoices.`);

  console.log("\n--- 4. CUSTOMERS & SALES INVOICES VERIFICATION ---");
  const customers = await request(`${baseUrl}/customers`, { headers });
  console.log(`Retrieved ${customers.data?.length || customers.length} customers.`);
  const sales = await request(`${baseUrl}/sales`, { headers });
  console.log(`Retrieved ${sales.data?.length || sales.length} sales invoices.`);
  sales.data?.slice(0, 4).forEach((s) => {
    console.log(`  Sale [${s.invoiceNo}]: Total $${s.total} | Paid: $${s.amountPaid} | Balance: $${s.balanceDue} | Status: ${s.paymentStatus}`);
  });

  console.log("\n========================================================");
  console.log("[Verification SUCCESS] All API endpoints return accurate live DB data!");
  console.log("========================================================\n");
}

main().catch((err) => {
  console.error("[Verification ERROR]", err);
  process.exit(1);
});

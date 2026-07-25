import Product from "../models/Product.js";
import Gemstone from "../models/Gemstone.js";
import GemstoneLot from "../models/GemstoneLot.js";
import Material from "../models/Material.js";
import Customer from "../models/Customer.js";
import Supplier from "../models/Supplier.js";
import JobCard from "../models/JobCard.js";
import Sale from "../models/Sale.js";
import Memo from "../models/Memo.js";
import PurchaseInvoice from "../models/PurchaseInvoice.js";
import Expense from "../models/Expense.js";
import Income from "../models/Income.js";
import Settings from "../models/Settings.js";

/**
 * Check if the user has the required permission or is an Admin
 */
function checkUserPermission(user, requiredPerm) {
  const role = user?.roleId || {};
  const roleName = typeof role === "string" ? role : role.name || "User";
  const permissions = Array.isArray(role.permissions) ? role.permissions : [];

  if (roleName === "Admin" || permissions.includes("*")) {
    return true;
  }

  if (requiredPerm) {
    return permissions.includes(requiredPerm);
  }

  return false;
}

/**
 * Groq Function Definitions (JSON Schema Format)
 */
export const GROQ_TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "get_inventory_summary",
      description:
        "Get total product stock counts, inventory monetary valuation (cost & selling value), gemstone counts, raw materials count, and low stock items.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "Optional product category filter (e.g. Gemstone, Jewellery, Watch, Accessory, Ring).",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_products",
      description:
        "Search or filter products by keyword, stock number, category, status (Available, Sold, On Memo), or stock level.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search keyword, product name, stock number (e.g. STK-1001), SKU, or barcode.",
          },
          category: { type: "string", description: "Filter by category." },
          status: { type: "string", description: "Filter by status (Draft, Available, Sold, On Memo, Reserved)." },
          lowStockOnly: { type: "boolean", description: "Set to true to find products at or below minimum stock level." },
          limit: { type: "number", description: "Max results to return (default 10)." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_customer_balances",
      description:
        "Query customers with outstanding unpaid balances, total unpaid customer debt, or specific customer balance.",
      parameters: {
        type: "object",
        properties: {
          customerName: { type: "string", description: "Optional specific customer name to search." },
          hasOutstandingOnly: { type: "boolean", description: "Set to true to return only customers with balance > 0." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_supplier_purchases",
      description:
        "Query supplier contact records, unpaid purchase invoices, stock inward history, or top suppliers by purchase volume.",
      parameters: {
        type: "object",
        properties: {
          supplierName: { type: "string", description: "Optional specific supplier company or contact name." },
          unpaidOnly: { type: "boolean", description: "Set to true to find purchase invoices with outstanding balance." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sales_and_invoices",
      description:
        "Query completed or recent sales, partially paid invoices, sales revenue, or payment statuses (Unpaid, Paid, Overdue).",
      parameters: {
        type: "object",
        properties: {
          paymentStatus: { type: "string", description: "Filter by payment status (Unpaid, Partially Paid, Paid, Overdue)." },
          timeframe: { type: "string", description: "Filter by time (e.g. 'this_month', 'all')." },
          limit: { type: "number", description: "Max records to return." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_memo_consignments",
      description:
        "Query items currently out on memo/consignment with clients, active memo count, and overdue memo returns.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Memo status (e.g. 'With Client', 'Overdue', 'Partially Returned')." },
          clientName: { type: "string", description: "Optional client name searching memos." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_production_job_cards",
      description:
        "Query active manufacturing job cards, stage progress (Design, Casting, Stone Setting, Polishing, QC, Completed), or assigned artisans.",
      parameters: {
        type: "object",
        properties: {
          stage: { type: "string", description: "Filter by stage (Design, Materials Issued, Manufacturing, Stone Setting, Polishing, QC, Completed)." },
          artisan: { type: "string", description: "Filter by assigned artisan/craftsman." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_financials_and_charity",
      description:
        "Query system gross profit, net profit, charity amount collected based on configured charity %, income and expense metrics.",
      parameters: {
        type: "object",
        properties: {
          includeDetails: { type: "boolean", description: "Include detailed income/expense category breakdown." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_workflow_instructions",
      description:
        "Retrieve exact step-by-step workflow instructions and feature descriptions for any module in SR TAKAT.",
      parameters: {
        type: "object",
        properties: {
          workflowName: {
            type: "string",
            description: "Module or workflow name (e.g. product_wizard, purchase_inward, sale_to_payment, memo_consignment, barcode_qr_scan, costing_charity, settings_roles).",
          },
        },
      },
    },
  },
];

/**
 * Execute Groq Tool Calls with User Permission Checks (RBAC)
 */
export async function executeChatbotTool({ name, args = {}, user }) {
  console.log(`[chatbotTools] Executing tool '${name}' for user: ${user?.fullName || "User"}`, args);

  switch (name) {
    case "get_inventory_summary": {
      if (!checkUserPermission(user, "inventory.view")) {
        return { error: "Access Restricted: You do not have permission to view inventory data." };
      }
      const match = { isDeleted: { $ne: true } };
      if (args.category) {
        match.category = new RegExp(args.category.trim(), "i");
      }

      const [totalProducts, outOfStock, available, reserved, onMemo, gemstonesCount, lotsCount, materialsCount, valRes] =
        await Promise.all([
          Product.countDocuments(match),
          Product.countDocuments({ ...match, quantity: { $lte: 0 } }),
          Product.countDocuments({ ...match, status: "Available" }),
          Product.countDocuments({ ...match, status: "Reserved" }),
          Product.countDocuments({ ...match, status: "On Memo" }),
          Gemstone.countDocuments({ isDeleted: { $ne: true } }),
          GemstoneLot.countDocuments({ isDeleted: { $ne: true } }),
          Material.countDocuments({ isDeleted: { $ne: true } }),
          Product.aggregate([
            { $match: match },
            {
              $group: {
                _id: null,
                totalCostValuation: { $sum: { $multiply: ["$costPrice", "$quantity"] } },
                totalSellingValuation: { $sum: { $multiply: ["$sellingPrice", "$quantity"] } },
              },
            },
          ]),
        ]);

      const valuation = valRes[0] || { totalCostValuation: 0, totalSellingValuation: 0 };

      return {
        totalProductsCatalog: totalProducts,
        availableForSale: available,
        reservedCount: reserved,
        outOnMemoCount: onMemo,
        outOfStockCount: outOfStock,
        totalLooseGemstones: gemstonesCount,
        totalGemstoneLots: lotsCount,
        totalRawMaterials: materialsCount,
        totalInventoryCostValueUSD: Math.round(valuation.totalCostValuation || 0),
        totalInventorySellingValueUSD: Math.round(valuation.totalSellingValuation || 0),
      };
    }

    case "search_products": {
      if (!checkUserPermission(user, "inventory.view")) {
        return { error: "Access Restricted: You do not have permission to view product data." };
      }
      const limit = Math.min(args.limit || 10, 20);
      const query = { isDeleted: { $ne: true } };

      if (args.query) {
        const regex = new RegExp(args.query.trim(), "i");
        query.$or = [{ name: regex }, { stockNo: regex }, { sku: regex }, { brand: regex }, { category: regex }];
      }

      if (args.category) {
        query.category = new RegExp(args.category.trim(), "i");
      }

      if (args.status) {
        query.status = args.status;
      }

      if (args.lowStockOnly) {
        query.$expr = { $lte: ["$quantity", "$minimumStock"] };
      }

      const products = await Product.find(query)
        .select("name stockNo category status quantity costPrice sellingPrice brand location")
        .limit(limit)
        .sort({ updatedAt: -1 })
        .lean();

      return {
        count: products.length,
        products: products.map((p) => ({
          stockNo: p.stockNo,
          name: p.name,
          category: p.category,
          status: p.status,
          quantity: p.quantity,
          costPriceUSD: p.costPrice,
          sellingPriceUSD: p.sellingPrice,
          brand: p.brand || "—",
          location: p.location || "—",
        })),
      };
    }

    case "get_customer_balances": {
      if (!checkUserPermission(user, "customers.view")) {
        return { error: "Access Restricted: You do not have permission to view customer data." };
      }
      const query = { isDeleted: { $ne: true } };

      if (args.customerName) {
        const regex = new RegExp(args.customerName.trim(), "i");
        query.$or = [{ fullName: regex }, { companyName: regex }];
      }

      if (args.hasOutstandingOnly !== false) {
        query.outstandingAmount = { $gt: 0 };
      }

      const customers = await Customer.find(query)
        .select("fullName companyName phone email customerType outstandingAmount")
        .sort({ outstandingAmount: -1 })
        .limit(15)
        .lean();

      const totalOutstanding = customers.reduce((sum, c) => sum + (c.outstandingAmount || 0), 0);

      return {
        totalCustomersWithOutstandingBalance: customers.length,
        totalOutstandingAmountUSD: Math.round(totalOutstanding),
        customers: customers.map((c) => ({
          name: c.fullName || c.companyName,
          company: c.companyName || "—",
          phone: c.phone,
          customerType: c.customerType,
          outstandingBalanceUSD: c.outstandingAmount || 0,
        })),
      };
    }

    case "get_supplier_purchases": {
      if (!checkUserPermission(user, "suppliers.view")) {
        return { error: "Access Restricted: You do not have permission to view supplier records." };
      }

      const query = { isDeleted: { $ne: true } };
      if (args.supplierName) {
        const regex = new RegExp(args.supplierName.trim(), "i");
        query.$or = [{ companyName: regex }, { contactName: regex }];
      }

      const suppliers = await Supplier.find(query)
        .select("companyName contactName phone supplierType totalPurchases totalPaid outstandingBalance")
        .sort({ outstandingBalance: -1, totalPurchases: -1 })
        .limit(15)
        .lean();

      let unpaidInvoices = [];
      if (args.unpaidOnly) {
        unpaidInvoices = await PurchaseInvoice.find({ paymentStatus: { $ne: "Paid" } })
          .select("invoiceNumber supplierName totalAmount paidAmount outstandingAmount paymentStatus createdAt")
          .limit(10)
          .lean();
      }

      return {
        suppliersCount: suppliers.length,
        suppliers: suppliers.map((s) => ({
          companyName: s.companyName,
          contactName: s.contactName || "—",
          supplierType: s.supplierType,
          totalPurchasesUSD: s.totalPurchases || 0,
          totalPaidUSD: s.totalPaid || 0,
          unpaidBalanceUSD: s.outstandingBalance || 0,
        })),
        ...(args.unpaidOnly ? { unpaidInvoices } : {}),
      };
    }

    case "get_sales_and_invoices": {
      if (!checkUserPermission(user, "sales.view")) {
        return { error: "Access Restricted: You do not have permission to view sales and invoice metrics." };
      }

      const query = {};
      if (args.paymentStatus) {
        query.paymentStatus = args.paymentStatus;
      }

      const limit = Math.min(args.limit || 10, 20);
      const sales = await Sale.find(query)
        .select("invoiceNo customerName totalAmount paidAmount dueAmount paymentStatus createdAt items")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      const [totalSalesCount, unpaidCount, totalRevenue] = await Promise.all([
        Sale.countDocuments(),
        Sale.countDocuments({ paymentStatus: { $in: ["Unpaid", "Partially Paid", "Overdue"] } }),
        Sale.aggregate([
          { $group: { _id: null, total: { $sum: "$totalAmount" }, paid: { $sum: "$paidAmount" }, due: { $sum: "$dueAmount" } } },
        ]),
      ]);

      const rev = totalRevenue[0] || { total: 0, paid: 0, due: 0 };

      return {
        totalSalesRecords: totalSalesCount,
        unpaidOrPartialInvoicesCount: unpaidCount,
        totalSalesRevenueUSD: Math.round(rev.total || 0),
        totalCollectedAmountUSD: Math.round(rev.paid || 0),
        totalOutstandingReceivablesUSD: Math.round(rev.due || 0),
        recentInvoices: sales.map((s) => ({
          invoiceNo: s.invoiceNo,
          customerName: s.customerName || "Walk-in Client",
          totalAmountUSD: s.totalAmount,
          paidAmountUSD: s.paidAmount,
          dueAmountUSD: s.dueAmount,
          paymentStatus: s.paymentStatus,
          date: s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 10) : "—",
        })),
      };
    }

    case "get_memo_consignments": {
      if (!checkUserPermission(user, "memos.view") && !checkUserPermission(user, "sales.view")) {
        return { error: "Access Restricted: You do not have permission to view memo/consignment records." };
      }

      const query = {};
      if (args.status) {
        query.status = args.status;
      }
      if (args.clientName) {
        query.clientName = new RegExp(args.clientName.trim(), "i");
      }

      const memos = await Memo.find(query)
        .select("memoNo clientName status returnDate totalValue items createdAt")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      const [activeCount, overdueCount] = await Promise.all([
        Memo.countDocuments({ status: { $in: ["With Client", "Extended", "Partially Returned"] } }),
        Memo.countDocuments({ status: "Overdue" }),
      ]);

      return {
        activeMemosWithClients: activeCount,
        overdueMemosCount: overdueCount,
        memos: memos.map((m) => ({
          memoNo: m.memoNo,
          clientName: m.clientName,
          status: m.status,
          totalValueUSD: m.totalValue,
          returnDate: m.returnDate ? new Date(m.returnDate).toISOString().slice(0, 10) : "—",
          itemsCount: m.items?.length || 0,
        })),
      };
    }

    case "get_production_job_cards": {
      if (!checkUserPermission(user, "production.view")) {
        return { error: "Access Restricted: You do not have permission to view production job cards." };
      }

      const query = {};
      if (args.stage) {
        query.currentStage = args.stage;
      }
      if (args.artisan) {
        query.assignedArtisan = new RegExp(args.artisan.trim(), "i");
      }

      const jobCards = await JobCard.find(query)
        .select("jobCardNo productName currentStage status priority assignedArtisan estimatedCompletionDate")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      const [inProgress, completed] = await Promise.all([
        JobCard.countDocuments({ status: "In Progress" }),
        JobCard.countDocuments({ status: "Completed" }),
      ]);

      return {
        inProgressJobCards: inProgress,
        completedJobCards: completed,
        recentJobCards: jobCards.map((j) => ({
          jobCardNo: j.jobCardNo,
          productName: j.productName,
          currentStage: j.currentStage,
          status: j.status,
          artisan: j.assignedArtisan || "Unassigned",
          estimatedCompletion: j.estimatedCompletionDate ? new Date(j.estimatedCompletionDate).toISOString().slice(0, 10) : "—",
        })),
      };
    }

    case "get_financials_and_charity": {
      if (!checkUserPermission(user, "reports.view")) {
        return { error: "Access Restricted: You do not have permission to view financial and charity reports." };
      }

      const settings = await Settings.getSettings();
      const charityPct = settings.charityPercentage || 2.0;

      const [salesAgg, expenseAgg, incomeAgg] = await Promise.all([
        Sale.aggregate([
          { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" }, totalCost: { $sum: "$totalCost" } } },
        ]),
        Expense.aggregate([{ $group: { _id: "$category", totalAmount: { $sum: "$amount" } } }]),
        Income.aggregate([{ $group: { _id: "$category", totalAmount: { $sum: "$amount" } } }]),
      ]);

      const salesData = salesAgg[0] || { totalRevenue: 0, totalCost: 0 };
      const grossProfit = Math.max(0, salesData.totalRevenue - salesData.totalCost);
      const charityAmount = Math.round(grossProfit * (charityPct / 100));
      const netProfit = grossProfit - charityAmount;

      const totalExpenses = expenseAgg.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
      const totalOtherIncome = incomeAgg.reduce((sum, i) => sum + (i.totalAmount || 0), 0);

      return {
        charityPercentageConfigured: `${charityPct}%`,
        charityFormula: "Charity Amount = Gross Profit * (Charity % / 100). Net Profit = Gross Profit - Charity Amount.",
        totalGrossProfitUSD: Math.round(grossProfit),
        totalCharityAllocatedUSD: charityAmount,
        totalNetProfitUSD: Math.round(netProfit),
        totalExpensesUSD: Math.round(totalExpenses),
        totalOtherIncomeUSD: Math.round(totalOtherIncome),
        ...(args.includeDetails
          ? {
              expenseBreakdown: expenseAgg.map((e) => ({ category: e._id || "Other", amountUSD: Math.round(e.totalAmount) })),
              incomeBreakdown: incomeAgg.map((i) => ({ category: i._id || "Other", amountUSD: Math.round(i.totalAmount) })),
            }
          : {}),
      };
    }

    case "get_workflow_instructions": {
      const workflows = {
        product_wizard:
          "Product Wizard Steps: 1. Basic Info (Stock #, Name, Category, Brand), 2. Category Details (Metal specs, Gold purity, Gemstone specs, Watch movement), 3. Pricing & Costs (Cost price, Selling price, Margin), 4. Inventory & Supplier (Warehouse, Location, Quantity, Reorder level, Supplier), 5. Review & Publish.",
        purchase_inward:
          "Supplier & Stock Inward Workflow: Create/Select Supplier -> Generate Purchase Invoice -> Add Stock Line Items (Gemstones/Products/Materials) -> Confirm Invoice -> Stock is automatically added to Inventory.",
        sale_to_payment:
          "Sales & Payment Workflow: Create Sale -> Add Products/Gemstones -> Select Customer -> Generate Invoice -> Record Payment (Cash/Card/Bank Transfer/Cheque) -> System updates Payment Status (Unpaid -> Partially Paid -> Paid) and deducts Inventory.",
        memo_consignment:
          "Memo Consignment Workflow: Create Memo -> Issue Items to Client -> Track Return Date -> When client returns or purchases: Mark Returned or Convert to Sale.",
        barcode_qr_scan:
          "QR & Barcode Scanning Workflow: Every product gets auto-generated Code 128 Barcode & QR Code. Use live camera or hardware scanner at /products/scan to look up item, verify stock, or update status.",
        costing_charity:
          "Costing & Charity Calculation: Gross Profit = Selling Price - Total Cost. Charity Amount = Gross Profit * (Charity % / 100). Default charity percentage is 2.0%, customizable in Settings.",
        settings_roles:
          "User Roles & Permissions: Admin can configure Charity %, Exchange Rates, Prefixes, Lab lists, User Roles, and User Access Permissions (inventory.view, sales.view, suppliers.view, etc.).",
      };

      const key = (args.workflowName || "").toLowerCase().trim();
      const matchedKey = Object.keys(workflows).find((k) => k.includes(key) || key.includes(k));

      return {
        workflowName: matchedKey || "general_workflows",
        instructions: matchedKey ? workflows[matchedKey] : workflows,
      };
    }

    default:
      return { error: `Unknown chatbot tool '${name}'` };
  }
}

export default {
  GROQ_TOOL_DEFINITIONS,
  executeChatbotTool,
};

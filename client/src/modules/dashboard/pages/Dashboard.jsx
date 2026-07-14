import { useAuth } from "@/contexts/AuthContext";
import { useDashboard, useAuditLogs } from "../hooks/useReports";
import { Link } from "react-router-dom";
import {
  DollarSign,
  Percent,
  Heart,
  Activity,
  TrendingUp,
  Gem,
  Package,
  Layers,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  ClipboardList,
  History,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMoney(n) {
  if (!n) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ title, value, subtitle, icon: Icon, iconBg, trend, trendUp, featured, onClick }) {
  if (featured) {
    return (
      <div 
        onClick={onClick}
        className={`relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0d3545] to-primary p-5 shadow-[0_8px_30px_rgba(10,73,88,0.22)] flex flex-col justify-between min-h-[145px] ${onClick ? "cursor-pointer" : ""}`}
      >
        <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -right-2 h-24 w-24 rounded-full bg-accent/10" />

        <div className="flex items-start justify-between gap-4 relative">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/60 mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-white tracking-[-0.03em]">{value}</p>
            <p className="mt-1 text-[12px] text-white/60 font-medium">{subtitle}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/15 shrink-0">
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>

        {trend && (
          <div className="relative mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-success/20 text-green-300`}
            >
              {trend}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[24px] bg-white border border-gray-100/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.015)] transition-all duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 flex flex-col justify-between min-h-[145px] ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-xl font-bold text-gray-900 tracking-[-0.03em]">{value}</p>
          <p className="mt-1 text-[12px] text-gray-500 font-medium leading-snug">{subtitle}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-[12px] shrink-0 ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              trendUp ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
            }`}
          >
            {trend}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[14px] bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.1)] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-gray-900">{fmtMoney(payload[0].value)}</p>
    </div>
  );
}

// ─── Stock Item Row ─────────────────────────────────────────────────────────

function StockItem({ label, value, color, pct }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0"
        style={{ backgroundColor: color + "20" }}
      >
        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[12px] font-semibold text-gray-700">{label}</span>
          <span className="text-[12px] font-bold text-gray-900">{fmtMoney(value)}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const { data: dashData, isLoading: isDashLoading } = useDashboard();
  const { data: logsData } = useAuditLogs();

  const kpis = dashData?.data?.kpis || {
    totalGemstones: 0,
    jewelleryStock: 0,
    watchStock: 0,
    inventoryCost: 0,
    sellingValue: 0,
    memoOnTime: 0,
    memoOverdue: 0,
    grossProfit: 0,
    charityAllocation: 0,
    netProfit: 0,
    totalRevenue: 0,
    invoiceCount: 0,
  };

  const widgets = dashData?.data?.widgets || {
    recentStock: [],
    lowStockOrMissingCert: [],
    overdueMemos: [],
    recentSales: [],
    pendingProduction: [],
  };

  const logs = logsData?.data || [];

  const totalStockMax = kpis.inventoryCost || 1;

  const kpiCards = [
    {
      title: "Total Revenue",
      value: fmtMoney(kpis.totalRevenue),
      subtitle: `${kpis.invoiceCount} invoices completed`,
      icon: DollarSign,
      iconBg: "bg-primary/10 text-primary",
      featured: true,
    },
    {
      title: "Total Gemstones",
      value: `${kpis.totalGemstones} Stones`,
      subtitle: "Active stones in inventory",
      icon: Gem,
      iconBg: "bg-amber-50 text-amber-600",
    },
    {
      title: "Jewellery Stock",
      value: `${kpis.jewelleryStock} Items`,
      subtitle: "Finished jewelry assemblies",
      icon: Package,
      iconBg: "bg-teal-50 text-teal-600",
    },
    {
      title: "Watch Stock",
      value: `${kpis.watchStock} Items`,
      subtitle: "Finished watch pieces",
      icon: Layers,
      iconBg: "bg-purple-50 text-purple-600",
    },
    {
      title: "Inventory Cost",
      value: fmtMoney(kpis.inventoryCost),
      subtitle: "Capital invested in stock",
      icon: Activity,
      iconBg: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Selling Value",
      value: fmtMoney(kpis.sellingValue),
      subtitle: "Total potential retail value",
      icon: ArrowUpRight,
      iconBg: "bg-blue-50 text-blue-600",
    },
    {
      title: "On Memo Consign",
      value: fmtMoney(kpis.memoOnTime + kpis.memoOverdue),
      subtitle: `On Time: ${fmtMoney(kpis.memoOnTime)} | Overdue: ${fmtMoney(kpis.memoOverdue)}`,
      icon: Clock,
      iconBg: kpis.memoOverdue > 0 ? "bg-rose-50 text-rose-500 font-semibold" : "bg-gray-50 text-gray-500",
      trend: kpis.memoOverdue > 0 ? "OVERDUE DETECTED" : "All clean",
      trendUp: kpis.memoOverdue > 0 ? false : true,
    },
    {
      title: "Charity Allocation (20%)",
      value: fmtMoney(kpis.charityAllocation),
      subtitle: "20% of transaction gross profit",
      icon: Heart,
      iconBg: "bg-rose-50 text-rose-500",
    },
    {
      title: "Net Profit",
      value: fmtMoney(kpis.netProfit),
      subtitle: "Retained profit after charity",
      icon: Percent,
      iconBg: "bg-indigo-50 text-indigo-600",
    },
  ];

  const barData = [
    { name: "Revenue", amount: kpis.totalRevenue },
    { name: "Gross Profit", amount: kpis.grossProfit },
    { name: "Charity", amount: kpis.charityAllocation },
    { name: "Net Profit", amount: kpis.netProfit },
  ];

  const BAR_COLORS = ["#0A4958", "#CB9B42", "#F87171", "#10B981"];

  const pieData = [
    { name: "Gemstones", value: kpis.inventoryCost * 0.45, color: "#BF953F" },
    { name: "Products", value: kpis.inventoryCost * 0.35, color: "#0A4958" },
    { name: "Materials", value: kpis.inventoryCost * 0.20, color: "#7A8B99" },
  ];

  if (isDashLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Welcome Banner ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-[-0.03em]">
            Good {getGreeting()}, {user?.fullName?.split(" ")[0] || "there"} 👋
          </h2>
          <p className="mt-1 text-[13px] text-gray-400 font-medium">
            Logged in as{" "}
            <span className="font-bold text-primary">{user?.roleId?.name}</span>
            {" · "}
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/8 px-3.5 py-1.5 text-[12px] font-semibold text-success">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            System Live
          </span>
        </div>
      </div>

      {/* ── KPI Stat Card Grid (9 Cards) ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-5">
        {kpiCards.map((kpi, idx) => (
          <StatCard key={idx} {...kpi} />
        ))}
      </div>

      {/* ── Charts Section ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Profit Bar Chart */}
        <div className="lg:col-span-2 rounded-[24px] bg-white border border-gray-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 tracking-[-0.02em]">
              Sales & Profit Overview
            </h3>
            <p className="text-[12px] text-gray-400 mt-0.5">Revenue, margins, charity deductions, and net profit</p>
          </div>
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="name"
                  stroke="#CBD5E1"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={6}
                />
                <YAxis
                  stroke="#CBD5E1"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => fmtMoney(v)}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F8FAFC", radius: 8 }} />
                <Bar dataKey="amount" radius={[10, 10, 4, 4]} maxBarSize={56}>
                  {barData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Distribution */}
        <div className="rounded-[24px] bg-white border border-gray-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-[14px] font-bold text-gray-900 tracking-[-0.02em]">
              Stock Distribution
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">By asset category</p>
          </div>
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-3.5">
              {pieData.map((s) => (
                <StockItem
                  key={s.name}
                  label={s.name}
                  value={s.value}
                  color={s.color}
                  pct={Math.round((s.value / totalStockMax) * 100)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Widgets Grid (PRD §3.1 requirements) ────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 1. Products On Memo (Overdue Highlights) */}
        <div className="rounded-[24px] bg-white border border-gray-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.015)] overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-bold text-gray-900 tracking-[-0.02em]">Overdue Memos</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Outstanding memos that have passed return date</p>
            </div>
            {widgets.overdueMemos.length > 0 && (
              <Badge variant="danger">{widgets.overdueMemos.length} Overdue</Badge>
            )}
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {widgets.overdueMemos.map((memo) => (
              <div key={memo._id} className="p-4 bg-rose-50/50 hover:bg-rose-50 transition-colors flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold text-gray-950">Memo #{memo.memoNo}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Client: {memo.customerName}</p>
                  <p className="text-xs text-danger font-semibold mt-0.5 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Due: {new Date(memo.expectedReturn).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-950">{fmtMoney(memo.value)}</p>
                  <Link to={`/memos`} className="text-xs text-accent hover:underline font-semibold block mt-1">Open</Link>
                </div>
              </div>
            ))}
            {widgets.overdueMemos.length === 0 && (
              <div className="py-12 text-center text-xs text-gray-400">No overdue memos.</div>
            )}
          </div>
        </div>

        {/* 2. Pending Production */}
        <div className="rounded-[24px] bg-white border border-gray-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.015)] overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-[14px] font-bold text-gray-900 tracking-[-0.02em]">Pending Production</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Job cards currently in progress in workshop</p>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {widgets.pendingProduction.map((job) => (
              <div key={job._id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold text-gray-950">Job #{job.jobNo}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Product: {job.productId?.name || "—"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Due: {new Date(job.expectedDate).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <Badge variant="warning">{job.status}</Badge>
                  <Link to={`/production/${job._id}`} className="text-xs text-accent hover:underline font-semibold block mt-1.5">View Stages</Link>
                </div>
              </div>
            ))}
            {widgets.pendingProduction.length === 0 && (
              <div className="py-12 text-center text-xs text-gray-400">No pending production jobs.</div>
            )}
          </div>
        </div>

        {/* 3. Recent Stock */}
        <div className="rounded-[24px] bg-white border border-gray-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.015)] overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-[14px] font-bold text-gray-900 tracking-[-0.02em]">Recent Stock Added</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Latest stones and jewelry created</p>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {widgets.recentStock.map((item, idx) => (
              <div key={idx} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold text-gray-950">{item.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.type} | Code: {item.code}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-950">{fmtMoney(item.cost)}</p>
                </div>
              </div>
            ))}
            {widgets.recentStock.length === 0 && (
              <div className="py-12 text-center text-xs text-gray-400">No stock added recently.</div>
            )}
          </div>
        </div>

        {/* 4. Missing Certificates / Low Stock */}
        <div className="rounded-[24px] bg-white border border-gray-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.015)] overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-[14px] font-bold text-gray-900 tracking-[-0.02em]">Missing Certificates</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Stones in stock without a certificate record</p>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {widgets.lowStockOrMissingCert.map((stone) => (
              <div key={stone._id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold text-gray-950">{stone.gemstone}</p>
                  <p className="text-xs text-gray-500 mt-0.5">ID: {stone.stoneId} | Weight: {stone.carat} ct</p>
                  <p className="text-xs text-amber-600 font-semibold mt-0.5 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Certificate missing
                  </p>
                </div>
                <div className="text-right">
                  <Link to={`/inventory`} className="text-xs text-accent hover:underline font-semibold block mt-1">Upload Cert</Link>
                </div>
              </div>
            ))}
            {widgets.lowStockOrMissingCert.length === 0 && (
              <div className="py-12 text-center text-xs text-gray-400">All stones have certificates.</div>
            )}
          </div>
        </div>

        {/* 5. Recent Sales Activity */}
        <div className="rounded-[24px] bg-white border border-gray-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.015)] overflow-hidden md:col-span-2">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-bold text-gray-900 tracking-[-0.02em]">Recent Sales</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Latest sales transactions completed</p>
            </div>
            <Link to="/sales" className="text-xs text-accent hover:underline font-semibold">View All Sales</Link>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {widgets.recentSales.map((sale) => (
              <div key={sale._id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold text-gray-950">Invoice #{sale.invoiceNo}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Client: {sale.customerId?.fullName || "Walk-in"}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Payment Method: {sale.paymentMethod}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">{fmtMoney(sale.total)}</p>
                  <span className="text-[10px] text-gray-400">{new Date(sale.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {widgets.recentSales.length === 0 && (
              <div className="py-12 text-center text-xs text-gray-400">No sales transactions logged.</div>
            )}
          </div>
        </div>

      </div>

      {/* ── System Audit Logs Widget ───────────────────────────────── */}
      <div className="rounded-[24px] bg-white border border-gray-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.015)] overflow-hidden">
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 tracking-[-0.02em]">
              Recent System Activity
            </h3>
            <p className="text-[12px] text-gray-400 mt-0.5">Latest audit log entries for changes in inventory, costing, and memos</p>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {logs.slice(0, 5).map((log) => (
            <div
              key={log._id}
              className="flex items-center justify-between gap-4 px-7 py-4 hover:bg-gray-50/60 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`h-9 w-9 rounded-[12px] flex items-center justify-center shrink-0 text-xs font-bold ${
                    log.action === "delete"
                      ? "bg-danger/10 text-danger"
                      : log.action === "create"
                      ? "bg-success/10 text-success"
                      : "bg-info/10 text-info"
                  }`}
                >
                  {log.action?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 text-sm">
                  <p className="font-semibold text-gray-900 truncate">
                    {log.userId?.fullName || "System"}{" "}
                    <span className="font-normal text-gray-500">performed</span>{" "}
                    <span className="text-primary font-bold">{log.action}</span>{" "}
                    <span className="text-gray-500">on</span>{" "}
                    <span className="font-bold">{log.entity}</span>
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <Badge
                variant={
                  log.action === "delete"
                    ? "danger"
                    : log.action === "create"
                    ? "success"
                    : "info"
                }
              >
                {log.action}
              </Badge>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="px-7 py-12 text-center text-[13px] text-gray-400">
              No activity recorded yet.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

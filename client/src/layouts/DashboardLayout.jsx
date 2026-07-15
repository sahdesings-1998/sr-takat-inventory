import { useState, useRef, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  LayoutDashboard,
  Bell,
  Users,
  Truck,
  Settings as SettingsIcon,
  History,
  Hammer,
  Calculator,
  FileText,
  Receipt,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  BarChart3,
  Search,
  ChevronDown,
  Menu,
  X,
  Package,
  Gem,
  Award,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/modules/notifications/hooks/useNotifications";
import Avatar from "@/components/ui/Avatar";
import { cn } from "@/utils/cn";

// ─── Navigation Config ────────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: "MENU",
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/notifications", icon: Bell, label: "Notifications", badge: true },
    ],
  },
  {
    label: "INVENTORY",
    items: [
      { to: "/customers", icon: Users, label: "Customers" },
      { to: "/suppliers", icon: Truck, label: "Suppliers" },
      { to: "/inventory", icon: Gem, label: "Gemstones & Lots" },
      { to: "/products", icon: FileSpreadsheet, label: "Jewellery & Watches" },
      { to: "/production", icon: Hammer, label: "Production" },
      { to: "/certificates", icon: Award, label: "Certificates" },
    ],
  },
  {
    label: "FINANCIAL",
    items: [
      { to: "/costing", icon: Calculator, label: "Costing Engine" },
      { to: "/memos", icon: FileText, label: "Memos / Consignment" },
      { to: "/incomes", icon: TrendingUp, label: "Income" },
      { to: "/expenses", icon: TrendingDown, label: "Expenses" },
      { to: "/sales", icon: Receipt, label: "Sales" },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { to: "/reports", icon: BarChart3, label: "Reports" },
    ],
  },
];

const ADMIN_ITEMS = [
  { to: "/settings", icon: SettingsIcon, label: "Settings" },
  { to: "/audit", icon: History, label: "Audit Log" },
];

// ─── Sidebar Content (shared between desktop + mobile drawer) ─────────────────

function SidebarContent({ unreadCount, isAdmin, onNavClick }) {
  const navItemClass = ({ isActive }) =>
    `group flex items-center gap-3 rounded-[14px] px-3.5 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer ${isActive
      ? "bg-primary text-white shadow-[0_4px_14px_rgba(10,73,88,0.3)]"
      : "text-gray-400 hover:bg-white/8 hover:text-white"
    }`;

  return (
    <>
      {/* Logo */}
      <div className="flex items-center px-5 py-4 border-b border-white/8 gap-3">
        <img
          src="/logo.png"
          alt="SR TAKAT"
          className="h-10 w-10 object-contain rounded-[10px] shrink-0"
          style={{ mixBlendMode: "screen", filter: "brightness(1.1) drop-shadow(0 2px 8px rgba(212,175,55,0.3))" }}
        />
        <div>
          <span className="block font-bold text-[15px] text-white tracking-[-0.02em] leading-tight">SR TAKAT</span>
          <span className="block text-[10px] text-gray-400 font-medium tracking-wider uppercase leading-tight mt-0.5">Gem & Jewellery</span>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 flex flex-col gap-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <p className="px-3.5 mb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500">
              {group.label}
            </p>
            {group.items.map(({ to, icon: Icon, label, badge }) => (
              <NavLink key={to} to={to} className={navItemClass} onClick={onNavClick}>
                <Icon className="h-[17px] w-[17px] shrink-0" />
                <span className="flex-1">{label}</span>
                {badge && unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white px-1.5">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            ))}
            {group.label === "TOOLS" && isAdmin &&
              ADMIN_ITEMS.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} className={navItemClass} onClick={onNavClick}>
                  <Icon className="h-[17px] w-[17px] shrink-0" />
                  <span>{label}</span>
                </NavLink>
              ))
            }
          </div>
        ))}
      </nav>

      {/* Bottom Card */}
      {/* <div className="mx-3 mb-4 rounded-[18px] bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/15 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent/20">
            <Package className="h-4.5 w-4.5 text-accent" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white">Inventory Pro</p>
            <p className="text-[11px] text-gray-400">Full access enabled</p>
          </div>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-3/4 rounded-full bg-accent/70" />
        </div>
        <p className="mt-1.5 text-[11px] text-gray-500">75% storage capacity</p>
      </div> */}
    </>
  );
}

// ─── Page Title Mapping ───────────────────────────────────────────────────────

function usePageMeta() {
  const { pathname } = useLocation();
  const map = {
    "/dashboard": { title: "Dashboard", sub: "Overview of your business" },
    "/notifications": { title: "Notifications", sub: "Alerts & updates" },
    "/certificates": { title: "Certificates", sub: "Gemstone & product laboratory reports" },
    "/customers": { title: "Customers", sub: "Manage your client database" },
    "/suppliers": { title: "Suppliers", sub: "Manage supply partners" },
    "/inventory": { title: "Inventory", sub: "Gemstones, lots & raw materials" },
    "/products": { title: "Products", sub: "Product catalogue & specs" },
    "/production": { title: "Job Cards", sub: "Production & manufacturing tracking" },
    "/costing": { title: "Costing", sub: "Cost analysis & estimates" },
    "/memos": { title: "Memos", sub: "Client memo management" },
    "/sales": { title: "Sales & Invoices", sub: "Revenue & billing records" },
    "/reports": { title: "Reports", sub: "Analytics & business insights" },
    "/settings": { title: "Settings", sub: "System configuration" },
    "/audit": { title: "Audit Log", sub: "Activity history & traceability" },
    "/incomes": { title: "Income", sub: "Manage incoming funds and revenue" },
    "/expenses": { title: "Expenses", sub: "Manage business expenditures" },
  };
  const base = "/" + pathname.split("/")[1];
  return map[base] || { title: "SR TAKAT", sub: "" };
}

// ─── Main Layout ──────────────────────────────────────────────────────────────

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const { title, sub } = usePageMeta();

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const isAdmin = user?.roleId?.name === "Admin";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex h-screen bg-[#f3f4f8] overflow-hidden">

      {/* ── Desktop Sidebar ───────────────────────────────────────────── */}
      <aside className="hidden rounded-xl m-3 md:flex w-[260px] shrink-0 flex-col bg-[#0d3545] border-r border-white/5">
        <SidebarContent
          unreadCount={unreadCount}
          isAdmin={isAdmin}
          onNavClick={() => { }}
        />
      </aside>

      {/* ── Mobile Drawer Overlay ─────────────────────────────────────── */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden transition-all duration-300",
          mobileOpen ? "visible pointer-events-auto" : "invisible pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileOpen(false)}
        />
        {/* Drawer panel */}
        <aside
          className={cn(
            "absolute left-0 top-0 bottom-0 w-[260px] flex flex-col bg-[#0d3545] shadow-2xl z-50 transition-transform duration-300 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <SidebarContent
            unreadCount={unreadCount}
            isAdmin={isAdmin}
            onNavClick={() => setMobileOpen(false)}
          />
        </aside>
      </div>

      {/* ── Main Column ───────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

        {/* ── Sticky Header ─────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 flex items-center gap-4 bg-[#f3f4f8]/95 backdrop-blur-md px-4 py-3 md:px-6 md:py-4 ">

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-white hover:text-gray-800 transition-all duration-200 border border-gray-200/80"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Page title block */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 tracking-[-0.025em] leading-tight truncate">
              {title}
            </h1>
            {sub && (
              <p className="text-xs text-gray-400 font-medium mt-0.5 truncate hidden sm:block">
                {sub}
              </p>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">

            {/* Search button */}
            <button className="flex items-center gap-2 h-10 px-4 rounded-xl bg-white border border-gray-200/80 text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hidden sm:flex">
              <Search className="h-4 w-4" />
              <span className="text-[13px] hidden lg:inline">Search...</span>
            </button>

            {/* Notifications */}
            <Link
              to="/notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-gray-200/80 text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white border-2 border-[#f3f4f8]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2.5 h-10 pl-2 pr-3 rounded-xl bg-white border border-gray-200/80 hover:border-gray-300 transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                <Avatar name={user?.fullName} size={28} />
                <div className="hidden sm:block text-left leading-tight">
                  <p className="text-[13px] font-semibold text-gray-900 truncate max-w-[100px]">
                    {user?.fullName?.split(" ")[0] || "User"}
                  </p>
                  <p className="text-[11px] font-medium text-accent uppercase tracking-wide">
                    {user?.roleId?.name}
                  </p>
                </div>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-52 rounded-[18px] bg-white border border-gray-100 shadow-[0_16px_40px_rgba(0,0,0,0.1)] overflow-hidden z-50">
                  <div className="px-4 py-3.5 border-b border-gray-100">
                    <p className="text-[13px] font-bold text-gray-900">{user?.fullName}</p>
                    <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger/8 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Page Content ──────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1440px] mx-auto px-4 py-5 md:px-6 md:py-7 w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

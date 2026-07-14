import { Outlet } from "react-router-dom";
import { Sparkles } from "lucide-react";

/**
 * Premium Auth Layout — split-screen with branding panel on the left
 * and the form panel on the right. Uses the actual SR TAKAT brand logo.
 */
export default function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-[#f3f4f8]">

      {/* ── Left Branding Panel ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[520px] xl:w-[580px] shrink-0 flex-col justify-between bg-[#0d3545] px-12 py-14 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 h-64 w-64 rounded-full bg-accent/10 -translate-x-1/2 -translate-y-1/2 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-primary/30 translate-x-1/2 translate-y-1/2 blur-3xl pointer-events-none" />

        {/* Logo — mix-blend-mode:screen makes white bg invisible on dark panel */}
        <div className="relative z-10">
          <img
            src="/logo.png"
            alt="SR TAKAT"
            className="h-24 w-auto object-contain"
            style={{
              mixBlendMode: "screen",
              filter: "brightness(1.15) drop-shadow(0 4px 20px rgba(212,175,55,0.4))",
            }}
          />
        </div>

        {/* Center Content */}
        <div className="relative z-10">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/15 px-4 py-2">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="text-[12px] font-semibold text-accent">Premium Inventory Management</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-[1.15] tracking-[-0.035em] mb-5">
            Manage your<br />
            <span className="text-accent">gem & jewellery</span><br />
            business with ease
          </h2>
          <p className="text-[15px] text-gray-400 leading-relaxed max-w-[360px]">
            From gemstone lots to finished products, costing, sales, and reporting — everything your jewellery business needs in one place.
          </p>

          {/* Feature Pills */}
          <div className="mt-8 flex flex-wrap gap-2.5">
            {["Gemstone Tracking", "Production Management", "Sales Invoicing", "Profit Analysis", "Audit Logs"].map((f) => (
              <span key={f} className="inline-flex items-center rounded-full border border-white/10 bg-white/8 px-3.5 py-1.5 text-[12px] font-medium text-gray-300">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="relative z-10 flex items-center gap-8">
          {[
            { label: "Products Managed", value: "1,200+" },
            { label: "Invoices Generated", value: "450+" },
            { label: "Stock Value", value: "$2.4M+" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xl font-bold text-white tracking-[-0.02em]">{s.value}</p>
              <p className="text-[11px] text-gray-400 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Form Panel ─────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">

        {/* Mobile Logo — shown only below lg breakpoint */}
        <div className="lg:hidden flex flex-col items-center mb-8">
          <img
            src="/logo.png"
            alt="SR TAKAT"
            className="h-24 w-auto object-contain"
          />
        </div>

        <div className="w-full max-w-[420px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

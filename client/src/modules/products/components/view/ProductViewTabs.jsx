import { cn } from "@/utils/cn";

export default function ProductViewTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto scrollbar-hide">
        <nav className="flex px-3 gap-0 min-w-max" role="tablist">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "relative px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg my-1 cursor-pointer",
                  isActive
                    ? "text-primary font-bold"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                )}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

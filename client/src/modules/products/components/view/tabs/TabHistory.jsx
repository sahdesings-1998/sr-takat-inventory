import {
  Plus, Package2, Edit3, ArrowRightLeft, Tag, ShieldCheck, ShoppingBag, RotateCcw, Archive, Clock,
} from "lucide-react";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";

// Map action names → icon + color
const ACTION_CONFIG = {
  create: { Icon: Plus, color: "bg-emerald-100 text-emerald-700" },
  created: { Icon: Plus, color: "bg-emerald-100 text-emerald-700" },
  update: { Icon: Edit3, color: "bg-sky-100 text-sky-700" },
  updated: { Icon: Edit3, color: "bg-sky-100 text-sky-700" },
  "price changed": { Icon: Tag, color: "bg-amber-100 text-amber-700" },
  "status changed": { Icon: ArrowRightLeft, color: "bg-violet-100 text-violet-700" },
  "certificate added": { Icon: ShieldCheck, color: "bg-teal-100 text-teal-700" },
  sold: { Icon: ShoppingBag, color: "bg-rose-100 text-rose-700" },
  returned: { Icon: RotateCcw, color: "bg-orange-100 text-orange-700" },
  archived: { Icon: Archive, color: "bg-gray-100 text-gray-700" },
  default: { Icon: Clock, color: "bg-gray-100 text-gray-700" },
};

function getActionConfig(action = "") {
  const key = action.toLowerCase();
  for (const [k, v] of Object.entries(ACTION_CONFIG)) {
    if (key.includes(k)) return v;
  }
  return ACTION_CONFIG.default;
}

function HistoryEntry({ entry, isLast }) {
  const { Icon, color } = getActionConfig(entry.action);
  const date = entry.date ? new Date(entry.date) : null;

  return (
    <div className="relative flex gap-4">
      {/* Vertical connector line */}
      {!isLast && (
        <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-100" />
      )}
      {/* Icon bubble */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-white ${color}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-900 capitalize">{entry.action}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {entry.user ? `By ${entry.user}` : "By System"}
              {entry.description ? ` — ${entry.description}` : ""}
            </p>
          </div>
          {date && (
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] font-semibold text-gray-500">
                {date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
              </p>
              <p className="text-[10px] text-gray-400">
                {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TabHistory({ product }) {
  const history = Array.isArray(product?.history) ? [...product.history].reverse() : [];

  if (history.length === 0) {
    return (
      <Card>
        <CardBody>
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Clock className="h-8 w-8 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-500">No History Available</p>
            <p className="text-xs text-gray-400 max-w-xs">
              Activity history for this product will appear here as changes are made.
            </p>
            {/* Show at least the creation entry */}
            {product?.createdAt && (
              <div className="mt-4 w-full max-w-sm">
                <HistoryEntry
                  entry={{
                    action: "created",
                    user: "System",
                    date: product.createdAt,
                    description: `Product ${product.productCode || ""} created`,
                  }}
                  isLast
                />
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 pl-3 border-l-[3px] border-primary/50 text-primary">
          <Clock className="h-4 w-4" />
          <h3 className="font-semibold text-gray-900 text-sm">Product Activity Timeline</h3>
          <span className="text-[10px] font-medium text-gray-400 ml-1">({history.length} events)</span>
        </div>
        <span className="text-xs text-gray-400">Read-only</span>
      </CardHeader>
      <CardBody>
        {/* Creation entry always first */}
        {product?.createdAt && (
          <HistoryEntry
            entry={{
              action: "created",
              user: "System",
              date: product.createdAt,
              description: `Product ${product.productCode || ""} registered`,
            }}
            isLast={history.length === 0}
          />
        )}
        {history.map((entry, idx) => (
          <HistoryEntry key={idx} entry={entry} isLast={idx === history.length - 1} />
        ))}
      </CardBody>
    </Card>
  );
}

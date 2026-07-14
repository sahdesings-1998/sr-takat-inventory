import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/utils/cn";

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    classes: "bg-success/10 text-success border-success/20",
  },
  danger: {
    icon: XCircle,
    classes: "bg-danger/10 text-danger border-danger/20",
  },
  warning: {
    icon: AlertTriangle,
    classes: "bg-warning/10 text-warning border-warning/20",
  },
  info: {
    icon: Info,
    classes: "bg-info/10 text-info border-info/20",
  },
};

export function Alert({ variant = "info", title, children, className }) {
  const config = VARIANTS[variant] || VARIANTS.info;
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={cn("flex items-start gap-3 rounded-lg border px-4 py-3 text-sm", config.classes, className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>
        {title && <p className="font-medium">{title}</p>}
        {children && <p className={title ? "mt-0.5" : ""}>{children}</p>}
      </div>
    </div>
  );
}

export default Alert;

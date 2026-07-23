import { cn } from "@/utils/cn";

/**
 * Premium Card component — rounded-[24px] with custom soft shadows and smooth hover transitions.
 */
export function Card({ className, children, p, ...props }) {
  const pClass = typeof p === "number" || typeof p === "string" ? `p-${p}` : "";

  return (
    <div
      className={cn(
        "rounded-[24px] border border-gray-100/80 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.015)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.035)]",
        pClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn("border-b border-gray-100/60 px-7 py-5.5 flex items-center justify-between gap-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...props }) {
  return (
    <div className={cn("px-7 py-6", className)} {...props}>
      {children}
    </div>
  );
}

export default Card;

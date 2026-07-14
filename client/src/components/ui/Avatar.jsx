import { cn } from "@/utils/cn";

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, src, size = 36, className }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || "Avatar"}
        style={{ width: size, height: size }}
        className={cn("rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "flex items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent",
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}

export default Avatar;

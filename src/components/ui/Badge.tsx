import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "live" | "offline" | "success" | "warning";
  className?: string;
}

const variantClasses = {
  default: "bg-zinc-800 text-zinc-300",
  live: "bg-yellow-400 text-black font-bold",
  offline: "bg-red-600 text-white",
  success: "bg-emerald-500 text-white",
  warning: "bg-orange-500 text-white",
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

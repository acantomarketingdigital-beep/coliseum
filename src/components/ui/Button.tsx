import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
}

const variantClasses = {
  primary:
    "bg-yellow-400 text-black font-bold hover:bg-yellow-300 active:bg-yellow-500 focus-visible:ring-yellow-400",
  secondary:
    "bg-zinc-800 text-white font-semibold hover:bg-zinc-700 active:bg-zinc-900 focus-visible:ring-zinc-500 border border-zinc-700",
  danger:
    "bg-red-600 text-white font-bold hover:bg-red-500 active:bg-red-700 focus-visible:ring-red-500",
  ghost:
    "bg-transparent text-zinc-300 hover:bg-zinc-800 active:bg-zinc-900 focus-visible:ring-zinc-600",
};

const sizeClasses = {
  sm: "h-9 px-3 text-sm rounded-lg",
  md: "h-11 px-4 text-sm rounded-xl",
  lg: "h-14 px-6 text-base rounded-xl",
  xl: "h-16 px-8 text-lg rounded-2xl",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 transition-colors duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950
        disabled:opacity-40 disabled:cursor-not-allowed select-none
        ${variantClasses[variant]} ${sizeClasses[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

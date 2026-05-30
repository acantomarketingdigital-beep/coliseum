import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  accent?: boolean;
}

export function Card({ children, className = "", accent = false }: CardProps) {
  return (
    <div
      className={`
        bg-zinc-900 rounded-2xl border
        ${accent ? "border-yellow-400 glow-yellow" : "border-zinc-800"}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`px-5 py-4 border-b border-zinc-800 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}

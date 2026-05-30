"use client";

import { Wifi, WifiOff, Trophy } from "lucide-react";
import { useMatchStore } from "@/store/matchStore";

export function Header() {
  const isOffline = useMatchStore((s) => s.isOffline);

  return (
    <header className="h-14 bg-zinc-950 border-b border-zinc-800 px-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <span className="text-white font-bold text-lg tracking-tight">
          Arena<span className="text-yellow-400">Ops</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-1.5 text-xs font-medium ${
            isOffline ? "text-red-400" : "text-emerald-400"
          }`}
        >
          {isOffline ? (
            <WifiOff className="w-3.5 h-3.5" />
          ) : (
            <Wifi className="w-3.5 h-3.5" />
          )}
          <span>{isOffline ? "Offline" : "Online"}</span>
        </div>
      </div>
    </header>
  );
}

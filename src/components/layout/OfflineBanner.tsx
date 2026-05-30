"use client";

import { WifiOff } from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useMatchStore } from "@/store/matchStore";

export function OfflineBanner() {
  const { isOffline } = useOfflineSync();
  const pendingSyncEvents = useMatchStore((s) => s.pendingSyncEvents);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-semibold">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Modo offline — trabalhando localmente</span>
      {pendingSyncEvents.length > 0 && (
        <span className="ml-2 bg-white/20 rounded-full px-2 py-0.5 text-xs">
          {pendingSyncEvents.length} evento{pendingSyncEvents.length !== 1 ? "s" : ""} para sincronizar
        </span>
      )}
    </div>
  );
}

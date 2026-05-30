"use client";

import { useEffect, useCallback } from "react";
import { get, set, del } from "idb-keyval";
import { useMatchStore } from "@/store/matchStore";
import { supabase } from "@/lib/supabase";
import type { Match, MatchEvent } from "@/types/database";

const KEY_MATCH  = "arena-ops:active-match";
const KEY_EVENTS = "arena-ops:pending-events";

export function useOfflineSync() {
  const {
    activeMatch,
    isOffline,
    pendingSyncEvents,
    setOffline,
    clearPendingEvents,
  } = useMatchStore();

  // Persiste partida ativa no IndexedDB sempre que muda
  useEffect(() => {
    if (activeMatch) {
      set(KEY_MATCH, activeMatch).catch(console.error);
    } else {
      del(KEY_MATCH).catch(console.error);
    }
  }, [activeMatch]);

  // Persiste fila de eventos offline
  useEffect(() => {
    set(KEY_EVENTS, pendingSyncEvents).catch(console.error);
  }, [pendingSyncEvents]);

  // Restaura estado do IndexedDB ao montar (suporta reload sem conexão)
  useEffect(() => {
    async function restore() {
      const cached = await get<Match>(KEY_MATCH);
      if (cached && !useMatchStore.getState().activeMatch) {
        // Restaura sem times (serão buscados quando online)
        useMatchStore.getState().setActiveMatch(cached, cached as never, cached as never);
      }
    }
    restore().catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Monitor de conectividade
  useEffect(() => {
    const onOnline  = () => { setOffline(false); syncPendingEvents(); };
    const onOffline = () => setOffline(true);

    setOffline(!navigator.onLine);
    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online",  onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const syncPendingEvents = useCallback(async () => {
    const pending = await get<MatchEvent[]>(KEY_EVENTS);
    if (!pending?.length) return;

    // Mapeia domínio (camelCase) → coluna DB (snake_case)
    const rows = pending.map((e) => ({
      id:          e.id,
      match_id:    e.matchId,
      team_id:     e.teamId,
      athlete_id:  e.athleteId ?? null,
      type:        e.type,
      minute:      e.minute,
      description: e.description ?? null,
      event_ts:    e.eventTs,
      sync_status: "synced" as const,
    }));

    try {
      const { error } = await supabase.from("match_events").upsert(rows, { onConflict: "id" });
      if (!error) {
        clearPendingEvents();
        await del(KEY_EVENTS);
      }
    } catch {
      // Próxima reconexão tentará novamente
    }
  }, [clearPendingEvents]);

  return { isOffline, pendingCount: pendingSyncEvents.length, syncPendingEvents };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar, ChevronRight, Layers, Plus,
  RefreshCw, Trophy, Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/types/database";

type TournamentRow = Tables<"tournaments">;

// ── Helpers ──────────────────────────────────────────────────────────────────

const FORMAT_LABEL: Record<string, string> = {
  round_robin: "Round Robin — Todos vs Todos",
  knockout: "Eliminatório",
  swiss: "Sistema Suíço",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot?: boolean }> = {
  draft:    { label: "Rascunho",  color: "text-zinc-500" },
  active:   { label: "Em Andamento", color: "text-yellow-400", dot: true },
  finished: { label: "Encerrado", color: "text-zinc-600" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ── Card de torneio ───────────────────────────────────────────────────────────

function TournamentCard({ t }: { t: TournamentRow }) {
  const cfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.active;
  const fmt = FORMAT_LABEL[t.format] ?? t.format;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4 hover:border-zinc-700 transition-colors">
      {/* Status + formato */}
      <div className="flex items-center justify-between gap-2">
        <span className={`flex items-center gap-1.5 text-xs font-bold ${cfg.color}`}>
          {cfg.dot && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-arena-pulse shrink-0" />}
          {cfg.label.toUpperCase()}
        </span>
        <span className="text-zinc-600 text-[10px] font-semibold truncate">{fmt}</span>
      </div>

      {/* Nome */}
      <div>
        <h2 className="text-white font-black text-xl tracking-tight leading-tight">{t.name}</h2>
        {t.start_date && (
          <p className="text-zinc-500 text-xs mt-1 flex items-center gap-1">
            <Calendar size={11} strokeWidth={2} />
            Início: {formatDate(t.start_date)}
          </p>
        )}
      </div>

      {/* Estatísticas */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
          <Users size={12} strokeWidth={2} />
          <span className="font-semibold">{t.team_count} times</span>
        </div>
        <div className="h-3 w-px bg-zinc-800" />
        <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
          <Layers size={12} strokeWidth={2} />
          <span className="font-semibold">{t.round_count} rodadas</span>
        </div>
        <div className="h-3 w-px bg-zinc-800" />
        <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
          <Trophy size={12} strokeWidth={2} />
          <span className="font-semibold">{(t.team_count * (t.team_count - 1)) / 2} jogos</span>
        </div>
      </div>

      {/* Ação */}
      <Link
        href={`/dashboard/campeonatos/${t.id}`}
        className="flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-700 text-zinc-300 hover:border-yellow-400/50 hover:text-yellow-400 text-sm font-bold transition-colors"
      >
        Ver Tabela de Jogos
        <ChevronRight size={14} strokeWidth={2.5} />
      </Link>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5">
        <Trophy size={36} className="text-zinc-600" />
      </div>
      <p className="text-white font-black text-xl mb-2">Nenhum campeonato ainda</p>
      <p className="text-zinc-500 text-sm max-w-xs mb-6">
        Crie o primeiro campeonato e o sistema gerará automaticamente toda a tabela de jogos.
      </p>
      <Link
        href="/dashboard/campeonatos/novo"
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-yellow-400 text-black font-black text-sm"
      >
        <Plus size={16} strokeWidth={3} />
        Criar Primeiro Campeonato
      </Link>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function CampeonatosPage() {
  const { profile, loading: authLoading } = useAuth();

  const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "finished">("all");

  const fetchTournaments = useCallback(async () => {
    if (!profile?.arena_id) return;
    const { data } = await supabase
      .from("tournaments")
      .select("*")
      .eq("arena_id", profile.arena_id)
      .order("created_at", { ascending: false });

    if (data) setTournaments(data);
    setLoading(false);
    setRefreshing(false);
  }, [profile?.arena_id]);

  useEffect(() => {
    if (!authLoading && profile) fetchTournaments();
  }, [authLoading, profile, fetchTournaments]);

  const filtered = activeFilter === "all"
    ? tournaments
    : tournaments.filter((t) => t.status === activeFilter);

  const activeCount   = tournaments.filter((t) => t.status === "active").length;
  const finishedCount = tournaments.filter((t) => t.status === "finished").length;

  if (authLoading || (!profile && loading)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 text-sm animate-arena-pulse">Carregando…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-900 px-4 sm:px-6 pt-6 pb-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-white font-black text-2xl tracking-tight">Campeonatos</h1>
              {activeCount > 0 && (
                <p className="text-yellow-400 text-xs font-semibold mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-arena-pulse inline-block" />
                  {activeCount} {activeCount === 1 ? "em andamento" : "em andamento"}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setRefreshing(true); fetchTournaments(); }}
                disabled={refreshing}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <RefreshCw size={14} strokeWidth={2.5} className={refreshing ? "animate-spin" : ""} />
              </button>
              {profile?.role === "arena_admin" && (
                <Link
                  href="/dashboard/campeonatos/novo"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400 text-black font-black text-sm"
                >
                  <Plus size={16} strokeWidth={3} />
                  Novo Campeonato
                </Link>
              )}
            </div>
          </div>

          {/* Filtros */}
          {tournaments.length > 0 && (
            <div className="flex gap-1">
              {([
                { key: "all" as const, label: "Todos", count: tournaments.length },
                { key: "active" as const, label: "Em Andamento", count: activeCount },
                { key: "finished" as const, label: "Encerrados", count: finishedCount },
              ] as const).map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${activeFilter === key ? "bg-yellow-400 text-black" : "text-zinc-500 hover:text-white hover:bg-zinc-800"}`}
                >
                  {label}
                  {count > 0 && (
                    <span className={`text-[10px] font-black ${activeFilter === key ? "text-black/60" : "text-zinc-600"}`}>{count}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl h-48 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((t) => <TournamentCard key={t.id} t={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}

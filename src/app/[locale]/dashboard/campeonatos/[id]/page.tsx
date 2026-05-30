"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar, CheckCircle2, ChevronRight, Clock4,
  Layers, Shield, Trophy, Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { MatchStatus, Tables } from "@/types/database";

type TournamentRow = Tables<"tournaments">;

interface MatchWithTeams {
  id: string;
  round_number: number | null;
  status: MatchStatus;
  score_a: number;
  score_b: number;
  scheduled_at: string | null;
  team_a: { id: string; name: string } | null;
  team_b: { id: string; name: string } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function formatStartDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

// ── Badge de status do jogo ───────────────────────────────────────────────────

function MatchStatusDot({ status }: { status: MatchStatus }) {
  if (status === "in_progress") {
    return <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-arena-pulse shrink-0" />;
  }
  if (status === "finished") {
    return <CheckCircle2 size={12} className="text-zinc-500 shrink-0" strokeWidth={2.5} />;
  }
  return <Clock4 size={12} className="text-zinc-700 shrink-0" strokeWidth={2} />;
}

// ── Linha de confronto ────────────────────────────────────────────────────────

function MatchRow({ match }: { match: MatchWithTeams }) {
  const isLive     = match.status === "in_progress";
  const isFinished = match.status === "finished";
  const canOpen    = isLive || match.status === "scheduled";

  return (
    <div className={`px-4 py-3.5 flex items-center gap-3 ${isLive ? "bg-yellow-400/5" : ""}`}>
      {/* Status dot */}
      <MatchStatusDot status={match.status} />

      {/* Times */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-bold text-sm truncate ${isLive ? "text-yellow-400" : "text-white"}`}>
            {match.team_a?.name ?? "?"}
          </span>
          {isFinished ? (
            <span className="text-zinc-300 font-black text-xs shrink-0 tabular-nums">
              {match.score_a} × {match.score_b}
            </span>
          ) : (
            <span className="text-zinc-700 font-black text-[10px] shrink-0">VS</span>
          )}
          <span className={`font-bold text-sm truncate text-right ${isLive ? "text-yellow-400" : "text-white"}`}>
            {match.team_b?.name ?? "?"}
          </span>
        </div>
        {match.scheduled_at && !isFinished && (
          <p className="text-zinc-600 text-[10px] mt-0.5">
            <Calendar size={9} className="inline mr-0.5" strokeWidth={2} />
            {formatDate(match.scheduled_at)}
          </p>
        )}
      </div>

      {/* Link para a súmula */}
      {canOpen && (
        <Link
          href={`/partida/${match.id}`}
          className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
            isLive
              ? "bg-yellow-400 text-black"
              : "border border-zinc-700 text-zinc-400 hover:border-yellow-400/50 hover:text-yellow-400"
          }`}
        >
          {isLive ? "Ao Vivo" : "Abrir"}
          <ChevronRight size={11} strokeWidth={2.5} />
        </Link>
      )}
    </div>
  );
}

// ── Página de detalhe ────────────────────────────────────────────────────────

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<TournamentRow | null>(null);
  const [matchesByRound, setMatchesByRound] = useState<Map<number, MatchWithTeams[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estatísticas
  const [stats, setStats] = useState({ played: 0, total: 0, live: 0 });

  useEffect(() => {
    async function load() {
      const [{ data: tData, error: tErr }, { data: mData, error: mErr }] = await Promise.all([
        supabase.from("tournaments").select("*").eq("id", tournamentId).single(),
        supabase
          .from("matches")
          .select(`
            id, round_number, status, score_a, score_b, scheduled_at,
            team_a:teams!matches_team_a_id_fkey ( id, name ),
            team_b:teams!matches_team_b_id_fkey ( id, name )
          `)
          .eq("tournament_id", tournamentId)
          .order("round_number", { ascending: true })
          .order("scheduled_at", { ascending: true }),
      ]);

      if (tErr || !tData) { setError("Campeonato não encontrado."); setLoading(false); return; }
      setTournament(tData);

      if (!mErr && mData) {
        const matches = mData as unknown as MatchWithTeams[];
        const byRound = new Map<number, MatchWithTeams[]>();

        matches.forEach((m) => {
          const rn = m.round_number ?? 0;
          if (!byRound.has(rn)) byRound.set(rn, []);
          byRound.get(rn)!.push(m);
        });

        setMatchesByRound(byRound);
        setStats({
          played: matches.filter((m) => m.status === "finished").length,
          total:  matches.length,
          live:   matches.filter((m) => m.status === "in_progress").length,
        });
      }

      setLoading(false);
    }
    load();
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 text-sm animate-arena-pulse">Carregando campeonato…</div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 px-6">
        <Trophy size={40} className="text-zinc-700" />
        <p className="text-red-400 font-semibold">{error ?? "Erro desconhecido."}</p>
        <button onClick={() => router.back()} className="text-zinc-400 text-sm underline">Voltar</button>
      </div>
    );
  }

  const progressPct = stats.total > 0 ? Math.round((stats.played / stats.total) * 100) : 0;
  const sortedRounds = Array.from(matchesByRound.keys()).sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-zinc-900 px-4 sm:px-6 pt-6 pb-5">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-zinc-400 text-sm mb-3 flex items-center gap-1 hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 12L5 7l4-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
            Campeonatos
          </button>

          {/* Status + formato */}
          <div className="flex items-center gap-2 mb-2">
            {tournament.status === "active" && (
              <span className="flex items-center gap-1.5 text-yellow-400 text-xs font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-arena-pulse" />
                EM ANDAMENTO
              </span>
            )}
            {tournament.status === "finished" && (
              <span className="flex items-center gap-1.5 text-zinc-500 text-xs font-semibold">
                <CheckCircle2 size={11} strokeWidth={2.5} />ENCERRADO
              </span>
            )}
            <span className="text-zinc-700 text-xs">·</span>
            <span className="text-zinc-500 text-xs font-semibold">Round Robin</span>
          </div>

          {/* Nome + link de inscrições */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="text-white font-black text-2xl tracking-tight">{tournament.name}</h1>
            <Link
              href={`/dashboard/campeonatos/${tournamentId}/equipes`}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-700 text-zinc-300 hover:border-yellow-400/50 hover:text-yellow-400 text-xs font-bold transition-colors"
            >
              <Shield size={12} strokeWidth={2} />
              Inscrições
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-zinc-500 text-xs">
            <span className="flex items-center gap-1.5">
              <Users size={12} strokeWidth={2} />
              {tournament.team_count} times
            </span>
            <span className="flex items-center gap-1.5">
              <Layers size={12} strokeWidth={2} />
              {tournament.round_count} rodadas
            </span>
            <span className="flex items-center gap-1.5">
              <Trophy size={12} strokeWidth={2} />
              {stats.played}/{stats.total} jogos disputados
            </span>
            {tournament.start_date && (
              <span className="flex items-center gap-1.5">
                <Calendar size={12} strokeWidth={2} />
                {formatStartDate(tournament.start_date)}
              </span>
            )}
          </div>

          {/* Barra de progresso */}
          {stats.total > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-zinc-600 text-[10px] font-semibold uppercase">Progresso</span>
                <span className="text-zinc-400 text-[10px] font-bold">{progressPct}%</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabela de jogos por rodada ─────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
        {sortedRounds.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-sm">
            Nenhum jogo registrado.
          </div>
        ) : (
          sortedRounds.map((roundNum) => {
            const roundMatches = matchesByRound.get(roundNum) ?? [];
            const liveInRound = roundMatches.some((m) => m.status === "in_progress");
            const doneInRound = roundMatches.every((m) => m.status === "finished");

            return (
              <div
                key={roundNum}
                className={`bg-zinc-900 border rounded-2xl overflow-hidden ${
                  liveInRound
                    ? "border-yellow-400/25"
                    : doneInRound
                      ? "border-zinc-800/50"
                      : "border-zinc-800"
                }`}
              >
                {/* Cabeçalho da rodada */}
                <div className={`px-4 py-3 border-b flex items-center justify-between ${liveInRound ? "border-yellow-400/20 bg-yellow-400/5" : "border-zinc-800 bg-zinc-800/30"}`}>
                  <span className={`text-xs font-black uppercase tracking-widest ${liveInRound ? "text-yellow-400" : "text-zinc-400"}`}>
                    {roundNum === 0 ? "Sem rodada" : `Rodada ${roundNum}`}
                  </span>
                  {doneInRound && (
                    <CheckCircle2 size={13} className="text-zinc-600" strokeWidth={2.5} />
                  )}
                  {liveInRound && (
                    <span className="text-[10px] text-yellow-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-arena-pulse" />
                      Ao Vivo
                    </span>
                  )}
                </div>

                {/* Confrontos da rodada */}
                <div className="divide-y divide-zinc-800/40">
                  {roundMatches.map((match) => (
                    <MatchRow key={match.id} match={match} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

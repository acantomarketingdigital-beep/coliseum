"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { useMatchStore } from "@/store/matchStore";
import { LineupModal } from "@/components/partida/LineupModal";
import { SubstitutionModal } from "@/components/partida/SubstitutionModal";
import { SanctionModal } from "@/components/partida/SanctionModal";
import type { Match, Tables, Team } from "@/types/database";

// ── Mapeadores ───────────────────────────────────────────────────────────────

function mapMatch(row: Tables<"matches">): Match {
  return {
    id: row.id, arenaId: row.arena_id, teamAId: row.team_a_id,
    teamBId: row.team_b_id, refereeId: row.referee_id, status: row.status,
    sport: row.sport, scoreA: row.score_a, scoreB: row.score_b,
    mvpAthleteId: row.mvp_athlete_id, mvpPhotoUrl: row.mvp_photo_url,
    syncStatus: row.sync_status, scheduledAt: row.scheduled_at,
    startedAt: row.started_at, finishedAt: row.finished_at,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function mapTeam(row: Tables<"teams">): Team {
  return {
    id: row.id, arenaId: row.arena_id, tournamentId: row.tournament_id ?? null,
    name: row.name, coachName: row.coach_name, logoUrl: row.logo_url,
    primaryColor: row.primary_color, status: (row.status ?? "pending") as Team["status"],
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

type AthleteRow = Tables<"athletes">;

// ── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-zinc-800 border border-zinc-700 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl animate-[stepSlideIn_0.2s_ease-out]">
      {msg}
    </div>
  );
}

// ── Indicador de saque ────────────────────────────────────────────────────────

function ServeIndicator({ active }: { active: boolean }) {
  if (!active) return <div className="w-5 h-5 shrink-0" />;
  return <span className="text-base animate-arena-pulse shrink-0" title="Saque">🏐</span>;
}

// ── Modal de fim de SET (não-decisivo) ────────────────────────────────────────

interface SetModalProps {
  winner: "a" | "b";
  teamAName: string;
  teamBName: string;
  setScoreA: number;
  setScoreB: number;
  setsA: number;
  setsB: number;
  onNextSet: () => void;
}

function SetModal({ winner, teamAName, teamBName, setScoreA, setScoreB, setsA, setsB, onNextSet }: SetModalProps) {
  const t = useTranslations("match");
  const winnerName = winner === "a" ? teamAName : teamBName;
  const nextSet = setsA + setsB + 1;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-sm px-6">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center gap-5 shadow-2xl animate-[stepSlideIn_0.25s_ease-out]">
        <span className="text-xs tracking-[0.25em] uppercase text-zinc-500 font-semibold">{t("setEnded")}</span>
        <div className="text-yellow-400 text-3xl font-black text-center">{winnerName} {t("wonSet")}</div>
        <div className="flex items-center gap-4">
          <span className="text-5xl font-black text-white font-display">{setScoreA}</span>
          <span className="text-2xl text-zinc-600 font-black">×</span>
          <span className="text-5xl font-black text-white font-display">{setScoreB}</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-400 text-sm font-semibold">
          <span>{t("sets")}</span>
          <span className="text-white font-black text-lg">{setsA} × {setsB}</span>
        </div>
        <button onClick={onNextSet} className="mt-2 w-full py-4 rounded-2xl bg-yellow-400 text-black font-black text-lg">
          {t("startSet", { n: nextSet })}
        </button>
      </div>
    </div>
  );
}

// ── Modal MVP (tela cheia — fim de partida) ───────────────────────────────────

interface MvpModalProps {
  matchWinner: "a" | "b";
  teamAName: string;
  teamBName: string;
  teamAId: string;
  teamBId: string;
  setsA: number;
  setsB: number;
  finalSetScoreA: number;
  finalSetScoreB: number;
  athletes: AthleteRow[];
  onConfirm: (athleteId: string | null) => Promise<void>;
  saving: boolean;
}

function MvpModal({
  matchWinner, teamAName, teamBName, teamAId, teamBId,
  setsA, setsB, finalSetScoreA, finalSetScoreB,
  athletes, onConfirm, saving,
}: MvpModalProps) {
  const t = useTranslations("match");
  const [selectedId, setSelectedId] = useState("");
  const winnerName = matchWinner === "a" ? teamAName : teamBName;
  const teamAAthletes = athletes.filter((a) => a.team_id === teamAId).sort((a, b) => a.jersey_number - b.jersey_number);
  const teamBAthletes = athletes.filter((a) => a.team_id === teamBId).sort((a, b) => a.jersey_number - b.jersey_number);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black px-6 py-8 overflow-y-auto">
      <div className="text-center mb-8 animate-[stepSlideIn_0.3s_ease-out]">
        <p className="text-zinc-500 text-xs tracking-[0.35em] uppercase font-bold mb-5">
          {t("matchEnded")}
        </p>
        <h1 className="text-yellow-400 font-black text-5xl sm:text-6xl tracking-tight mb-1 glow-yellow">
          {winnerName}
        </h1>
        <p className="text-white text-xl font-bold mb-4">{t("wonMatch")}</p>
        <div className="flex items-center justify-center gap-3">
          <span className="font-display font-black text-white text-4xl tabular-nums">{finalSetScoreA}</span>
          <span className="text-zinc-600 font-black text-2xl">×</span>
          <span className="font-display font-black text-white text-4xl tabular-nums">{finalSetScoreB}</span>
        </div>
        <p className="text-zinc-500 text-sm mt-2 font-semibold">
          {t("sets")}: {setsA} × {setsB}
        </p>
      </div>

      <div className="w-full max-w-sm border-t border-zinc-800 mb-8" />

      <div className="w-full max-w-sm flex flex-col gap-5 animate-[stepSlideIn_0.4s_ease-out]">
        <div className="text-center">
          <p className="text-zinc-500 text-xs tracking-[0.2em] uppercase font-semibold mb-1">{t("selectMvp")}</p>
          <p className="text-white font-black text-2xl">{t("mvpTitle")}</p>
          <p className="text-zinc-600 text-xs mt-1">{t("mvpCaption")}</p>
        </div>

        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-2xl px-5 py-4 text-base font-semibold focus:outline-none focus:border-yellow-400 transition-colors"
        >
          <option value="">{t("selectAthlete")}</option>
          {teamAAthletes.length > 0 && (
            <optgroup label={teamAName}>
              {teamAAthletes.map((a) => (
                <option key={a.id} value={a.id}>#{a.jersey_number} — {a.name}</option>
              ))}
            </optgroup>
          )}
          {teamBAthletes.length > 0 && (
            <optgroup label={teamBName}>
              {teamBAthletes.map((a) => (
                <option key={a.id} value={a.id}>#{a.jersey_number} — {a.name}</option>
              ))}
            </optgroup>
          )}
        </select>

        <button
          onClick={() => onConfirm(selectedId || null)}
          disabled={saving}
          className="w-full py-5 rounded-2xl bg-yellow-400 text-black font-black text-xl tracking-wide disabled:opacity-60 transition-opacity"
        >
          {saving ? t("ending") : t("endMatch")}
        </button>

        <button
          onClick={() => onConfirm(null)}
          disabled={saving}
          className="text-zinc-600 text-sm font-semibold text-center hover:text-zinc-400 transition-colors py-2"
        >
          {t("endWithoutMvp")}
        </button>
      </div>
    </div>
  );
}

// ── Metade da quadra ─────────────────────────────────────────────────────────

interface TeamHalfProps {
  name: string;
  score: number;
  serving: boolean;
  servingSide: "a" | "b" | null;
  onPoint: () => void;
  onSubstitution: () => void;
  onServeSelect: () => void;
  disabled: boolean;
}

function TeamHalf({ name, score, serving, servingSide, onPoint, onSubstitution, onServeSelect, disabled }: TeamHalfProps) {
  const t = useTranslations("match");
  const [pressing, setPressing] = useState(false);
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="shrink-0 flex items-center justify-center gap-2 pt-5 pb-2 px-3">
        <ServeIndicator active={serving} />
        <span className="text-white font-black text-lg sm:text-xl tracking-tight truncate text-center" title={name}>{name}</span>
        {servingSide === null && (
          <button onClick={onServeSelect} className="shrink-0 text-[10px] text-yellow-400 border border-yellow-400/40 rounded-full px-1.5 py-0.5 font-semibold">
            {t("serve")}
          </button>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center">
        <span className={`font-display font-black tabular-nums select-none transition-all duration-75 text-8xl sm:text-9xl ${pressing ? "scale-95 text-yellow-300" : "text-yellow-400"}`}>
          {score}
        </span>
      </div>

      <div className="shrink-0 px-3 pb-2">
        <button
          onPointerDown={() => { if (!disabled) setPressing(true); }}
          onPointerUp={() => { if (!disabled && pressing) { setPressing(false); onPoint(); } }}
          onPointerLeave={() => setPressing(false)}
          disabled={disabled}
          className={`w-full rounded-2xl font-black text-xl tracking-wide transition-all duration-75 touch-manipulation min-h-[80px] sm:min-h-[96px] ${disabled ? "bg-zinc-800 text-zinc-600 cursor-not-allowed" : pressing ? "bg-yellow-300 text-black scale-[0.97]" : "bg-yellow-400 text-black"}`}
        >
          {t("point")}
        </button>
      </div>

      <div className="shrink-0 px-3 pb-5">
        <button onClick={onSubstitution} className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors text-xs font-semibold">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 5h10M9 2l3 3-3 3M12 9H2M5 6l-3 3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t("substitution")}
        </button>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function PartidaPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;
  const locale  = (params.locale as string) ?? "pt";

  const t = useTranslations("match");

  const {
    activeMatch, teamA, teamB,
    setActiveMatch, setStatus, setMvp,
    addPoint, undoLastPoint, startNextSet, setServingSide,
    isOffline,
    setsA, setsB, setScoreA, setScoreB,
    servingSide, setWinner, matchWinner, isTiebreak, history,
    needsLineup, markLineupDone,
    sideChangeDone, sideChangeScore,
  } = useMatchStore();

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [athletes, setAthletes] = useState<AthleteRow[]>([]);
  const [savingMvp, setSavingMvp] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [subModal, setSubModal] = useState<"a" | "b" | null>(null);
  const [sanctionModal, setSanctionModal] = useState(false);
  const clearToast = useRef(() => setToast(null));

  // ── Carrega partida ──────────────────────────────────────────────────────

  useEffect(() => {
    if (activeMatch?.id === matchId) { setLoading(false); return; }
    async function load() {
      setLoading(true);
      const { data: matchRow, error: mErr } = await supabase.from("matches").select("*").eq("id", matchId).single();
      if (mErr || !matchRow) { setFetchError(t("notFound")); setLoading(false); return; }

      const [{ data: tA }, { data: tB }] = await Promise.all([
        supabase.from("teams").select("*").eq("id", matchRow.team_a_id).single(),
        supabase.from("teams").select("*").eq("id", matchRow.team_b_id).single(),
      ]);
      if (!tA || !tB) { setFetchError(t("teamsNotFound")); setLoading(false); return; }

      setActiveMatch(mapMatch(matchRow), mapTeam(tA), mapTeam(tB));

      if (matchRow.status === "scheduled") {
        setStatus("in_progress");
        await supabase.from("matches").update({ status: "in_progress", started_at: new Date().toISOString() }).eq("id", matchId);
        await supabase.from("match_sets").upsert({ match_id: matchId, set_number: 1, started_at: new Date().toISOString() }, { onConflict: "match_id,set_number" });
      }
      setLoading(false);
    }
    load();
  }, [matchId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Carrega atletas ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!activeMatch) return;
    supabase
      .from("athletes")
      .select("*")
      .in("team_id", [activeMatch.teamAId, activeMatch.teamBId])
      .order("jersey_number")
      .then(({ data }) => { if (data) setAthletes(data); });
  }, [activeMatch?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Confirmar MVP e encerrar ─────────────────────────────────────────────

  async function handleMvpConfirm(athleteId: string | null) {
    if (!activeMatch) return;
    setSavingMvp(true);
    try {
      await supabase.from("matches").update({
        status: "finished",
        finished_at: new Date().toISOString(),
        mvp_athlete_id: athleteId,
      }).eq("id", activeMatch.id);

      setStatus("finished");
      if (athleteId) setMvp(athleteId);
    } finally {
      setSavingMvp(false);
      router.push(`/${locale}/dashboard/partidas`);
    }
  }

  // ── Loading / erro ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-zinc-500 text-sm animate-arena-pulse">{t("loading")}</div>
      </div>
    );
  }
  if (fetchError || !activeMatch || !teamA || !teamB) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-red-400 font-semibold">{fetchError ?? t("notFound")}</p>
        <button onClick={() => router.push(`/${locale}/dashboard`)} className="text-zinc-400 text-sm underline">
          {t("backToDashboard")}
        </button>
      </div>
    );
  }

  const currentSet    = setsA + setsB + 1;
  const canUndo       = history.length > 0;
  const teamAName     = teamA.name;
  const teamBName     = teamB.name;
  const isDecidingSet = isTiebreak;

  return (
    <div className="min-h-screen h-screen bg-black flex flex-col overflow-hidden select-none">
      {toast && <Toast msg={toast} onDone={clearToast.current} />}

      {/* Modal MVP */}
      {matchWinner && (
        <MvpModal
          matchWinner={matchWinner} teamAName={teamAName} teamBName={teamBName}
          teamAId={activeMatch.teamAId} teamBId={activeMatch.teamBId}
          setsA={setsA} setsB={setsB}
          finalSetScoreA={setScoreA} finalSetScoreB={setScoreB}
          athletes={athletes} onConfirm={handleMvpConfirm} saving={savingMvp}
        />
      )}

      {/* Modal fim de set */}
      {setWinner && !matchWinner && (
        <SetModal
          winner={setWinner} teamAName={teamAName} teamBName={teamBName}
          setScoreA={setScoreA} setScoreB={setScoreB}
          setsA={setsA} setsB={setsB} onNextSet={startNextSet}
        />
      )}

      {/* Modal de formação */}
      {needsLineup && !setWinner && !matchWinner && (
        <LineupModal
          matchId={activeMatch.id} setNumber={currentSet}
          teamAName={teamAName} teamBName={teamBName}
          onConfirm={markLineupDone} onSkip={markLineupDone}
        />
      )}

      {/* Modal de substituição */}
      {subModal && (
        <SubstitutionModal
          matchId={activeMatch.id} setNumber={currentSet}
          teamSide={subModal} teamName={subModal === "a" ? teamAName : teamBName}
          scoreA={setScoreA} scoreB={setScoreB}
          onClose={() => setSubModal(null)}
        />
      )}

      {/* Modal de sanção */}
      {sanctionModal && (
        <SanctionModal
          matchId={activeMatch.id} setNumber={currentSet}
          teamAName={teamAName} teamBName={teamBName}
          scoreA={setScoreA} scoreB={setScoreB}
          onClose={() => setSanctionModal(false)}
        />
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between px-3 h-14 border-b border-zinc-900 gap-2">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors text-sm font-semibold shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hidden sm:inline">{t("back")}</span>
        </button>

        <div className="flex items-center gap-2 flex-1 justify-center">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-arena-pulse shrink-0" />
            <span className="text-zinc-300 text-xs sm:text-sm font-semibold whitespace-nowrap">
              {isDecidingSet ? t("tiebreak") : `${currentSet}° ${t("set")}`}
            </span>
          </div>
          {isDecidingSet && sideChangeDone && sideChangeScore && (
            <span className="text-[10px] text-yellow-400 border border-yellow-400/30 px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap hidden sm:inline">
              ↔ {sideChangeScore.a}×{sideChangeScore.b}
            </span>
          )}
          {isOffline && (
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-semibold">{t("offline")}</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1.5 rounded-xl border border-zinc-800">
            <span className="text-white font-black text-sm tabular-nums">{setsA}</span>
            <span className="text-zinc-600 text-xs">×</span>
            <span className="text-white font-black text-sm tabular-nums">{setsB}</span>
          </div>

          <button onClick={() => setSanctionModal(true)} title={t("sanctionTooltip")}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-orange-400 hover:border-orange-400/40 transition-all">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="2" width="8" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9 5l4-3v9l-4-3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </button>

          <button onClick={undoLastPoint} disabled={!canUndo} title={t("undoTooltip")}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${canUndo ? "bg-zinc-800 hover:bg-zinc-700 text-yellow-400" : "bg-zinc-900 text-zinc-700 cursor-not-allowed"}`}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M2.5 7.5a5 5 0 1 0 1.4-3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M2.5 3.5v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Quadra ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden">
        <TeamHalf
          name={teamAName} score={setScoreA} serving={servingSide === "a"}
          servingSide={servingSide}
          onPoint={() => addPoint("a")}
          onSubstitution={() => setSubModal("a")}
          onServeSelect={() => setServingSide("a")}
          disabled={!!setWinner || !!matchWinner}
        />
        <div className="w-px bg-zinc-900 shrink-0" />
        <TeamHalf
          name={teamBName} score={setScoreB} serving={servingSide === "b"}
          servingSide={servingSide}
          onPoint={() => addPoint("b")}
          onSubstitution={() => setSubModal("b")}
          onServeSelect={() => setServingSide("b")}
          disabled={!!setWinner || !!matchWinner}
        />
      </main>

      {isDecidingSet && sideChangeDone && sideChangeScore && (
        <div className="shrink-0 text-center py-1.5 border-t border-zinc-900 sm:hidden">
          <span className="text-[10px] text-yellow-400 font-semibold">
            ↔ Troca de lado: {sideChangeScore.a}×{sideChangeScore.b}
          </span>
        </div>
      )}
    </div>
  );
}

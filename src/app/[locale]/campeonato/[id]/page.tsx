"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Calendar, Check, Share2, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "standings" | "matches" | "highlights";

interface TournamentInfo {
  id: string;
  name: string;
  status: string;
  team_count: number;
  round_count: number;
  start_date: string | null;
}

interface TeamInfo { id: string; name: string }
interface AthleteInfo { id: string; name: string; jersey_number: number | null }

interface MatchFull {
  id: string;
  round_number: number | null;
  status: string;
  score_a: number;
  score_b: number;
  scheduled_at: string | null;
  mvp_photo_url: string | null;
  mvp_athlete_id: string | null;
  team_a: TeamInfo | null;
  team_b: TeamInfo | null;
  mvp_athlete: AthleteInfo | null;
}

interface TeamStanding {
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  losses: number;
  pts: number;
  setsWon: number;
  setsLost: number;
}

// ── Standings (sistema brasileiro CBV) ───────────────────────────────────────

function computeStandings(matches: MatchFull[]): TeamStanding[] {
  const map = new Map<string, TeamStanding>();

  function ensure(team: TeamInfo): TeamStanding {
    if (!map.has(team.id)) {
      map.set(team.id, {
        teamId: team.id, teamName: team.name,
        played: 0, wins: 0, losses: 0, pts: 0, setsWon: 0, setsLost: 0,
      });
    }
    return map.get(team.id)!;
  }

  for (const m of matches) {
    if (m.status !== "finished" || !m.team_a || !m.team_b) continue;
    const sa = ensure(m.team_a);
    const sb = ensure(m.team_b);

    sa.played++; sb.played++;
    sa.setsWon += m.score_a; sa.setsLost += m.score_b;
    sb.setsWon += m.score_b; sb.setsLost += m.score_a;

    const decider = m.score_a + m.score_b === 5;

    if (m.score_a > m.score_b) {
      sa.wins++; sb.losses++;
      sa.pts += decider ? 2 : 3; sb.pts += decider ? 1 : 0;
    } else {
      sb.wins++; sa.losses++;
      sb.pts += decider ? 2 : 3; sa.pts += decider ? 1 : 0;
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.wins !== a.wins) return b.wins - a.wins;
    const ra = a.setsLost ? a.setsWon / a.setsLost : a.setsWon;
    const rb = b.setsLost ? b.setsWon / b.setsLost : b.setsWon;
    return rb - ra;
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    weekday: "short", day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

function MedalOrPos({ pos }: { pos: number }) {
  if (pos === 1) return <span className="text-base leading-none">🥇</span>;
  if (pos === 2) return <span className="text-base leading-none">🥈</span>;
  if (pos === 3) return <span className="text-base leading-none">🥉</span>;
  return <span className="text-zinc-600 text-xs font-bold tabular-nums">{pos}</span>;
}

// ── MatchCard ─────────────────────────────────────────────────────────────────

function MatchCard({ m, showScore, roundLabel }: { m: MatchFull; showScore: boolean; roundLabel: string }) {
  const isLive = m.status === "in_progress";
  const aWon   = showScore && m.score_a > m.score_b;
  const bWon   = showScore && m.score_b > m.score_a;

  const nameClass = (won: boolean) =>
    showScore
      ? won ? "text-zinc-100" : "text-zinc-500"
      : isLive ? "text-yellow-400" : "text-zinc-200";

  return (
    <div className={`rounded-xl px-4 py-3.5 border ${
      isLive ? "bg-yellow-400/5 border-yellow-400/20"
             : showScore ? "bg-zinc-900/40 border-zinc-800/30"
                         : "bg-zinc-900 border-zinc-800"
    }`}>
      {isLive && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />
          <span className="text-yellow-400 text-[10px] font-black uppercase tracking-wider">Live</span>
        </div>
      )}
      <div className="flex items-center gap-3">
        <span className={`flex-1 text-right text-sm font-bold truncate ${nameClass(aWon)}`}>
          {m.team_a?.name ?? "?"}
        </span>
        {showScore ? (
          <span className="text-zinc-200 font-black text-base shrink-0 tabular-nums">
            {m.score_a}<span className="text-zinc-700 mx-0.5">×</span>{m.score_b}
          </span>
        ) : (
          <span className="text-zinc-800 font-black text-[11px] shrink-0">VS</span>
        )}
        <span className={`flex-1 text-sm font-bold truncate ${nameClass(bWon)}`}>
          {m.team_b?.name ?? "?"}
        </span>
      </div>
      {m.scheduled_at && !showScore && !isLive && (
        <p className="text-zinc-600 text-[10px] text-center mt-2 flex items-center justify-center gap-1">
          <Calendar size={9} strokeWidth={2} />
          {fmtDateTime(m.scheduled_at)}
        </p>
      )}
      {roundLabel && (
        <p className="text-zinc-800 text-[10px] text-center mt-1.5">{roundLabel}</p>
      )}
    </div>
  );
}

// ── Aba 1: Classificação ──────────────────────────────────────────────────────

function StandingsTab({ standings }: { standings: TeamStanding[] }) {
  const t = useTranslations("portal.standings");

  if (standings.length === 0) {
    return <div className="py-16 text-center text-zinc-600 text-sm px-6">{t("noMatches")}</div>;
  }

  return (
    <div className="px-4 py-4">
      <div className="flex items-center px-3 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
        <div className="w-7 shrink-0" />
        <div className="flex-1 min-w-0">{t("team")}</div>
        <div className="w-7 text-center">{t("played")}</div>
        <div className="w-7 text-center">{t("wins")}</div>
        <div className="w-7 text-center">{t("losses")}</div>
        <div className="w-10 text-center">{t("sets")}</div>
        <div className="w-9 text-center text-yellow-700">{t("pts")}</div>
      </div>

      <div className="flex flex-col gap-1.5">
        {standings.map((s, idx) => {
          const pos = idx + 1;
          const isFirst = pos === 1;
          const isTop = pos <= 3;
          return (
            <div
              key={s.teamId}
              className={`flex items-center px-3 py-3 rounded-xl ${
                isFirst ? "bg-yellow-400/10 border border-yellow-400/20"
                        : isTop ? "bg-zinc-900 border border-zinc-800/60"
                                : "bg-zinc-900/40"
              }`}
            >
              <div className="w-7 shrink-0 flex justify-center"><MedalOrPos pos={pos} /></div>
              <div className="flex-1 min-w-0">
                <span className={`font-bold text-sm block truncate ${isFirst ? "text-yellow-400" : "text-zinc-100"}`}>
                  {s.teamName}
                </span>
              </div>
              <div className="w-7 text-center text-zinc-600 text-xs">{s.played}</div>
              <div className="w-7 text-center text-zinc-300 text-xs font-semibold">{s.wins}</div>
              <div className="w-7 text-center text-zinc-600 text-xs">{s.losses}</div>
              <div className="w-10 text-center text-zinc-600 text-xs tabular-nums">{s.setsWon}/{s.setsLost}</div>
              <div className={`w-9 text-center text-sm font-black tabular-nums ${isFirst ? "text-yellow-400" : "text-zinc-100"}`}>
                {s.pts}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-zinc-800 text-[10px] text-center mt-4 leading-relaxed">{t("legend")}</p>
    </div>
  );
}

// ── Aba 2: Jogos ──────────────────────────────────────────────────────────────

function MatchesTab({ matches }: { matches: MatchFull[] }) {
  const t = useTranslations("portal.matches");

  const live     = matches.filter(m => m.status === "in_progress");
  const upcoming = matches.filter(m => m.status === "scheduled");
  const finished = [...matches.filter(m => m.status === "finished")].reverse();

  if (live.length + upcoming.length + finished.length === 0) {
    return <div className="py-16 text-center text-zinc-600 text-sm">{t("noMatches")}</div>;
  }

  function Section({ title, items, showScore }: { title: string; items: MatchFull[]; showScore: boolean }) {
    if (items.length === 0) return null;
    return (
      <section>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">{title}</h3>
        <div className="flex flex-col gap-2">
          {items.map(m => (
            <MatchCard
              key={m.id} m={m} showScore={showScore}
              roundLabel={m.round_number ? t("round", { n: m.round_number }) : ""}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-5">
      <Section title={t("live")} items={live} showScore={false} />
      <Section title={t("upcoming")} items={upcoming} showScore={false} />
      <Section title={t("finished")} items={finished} showScore={true} />
    </div>
  );
}

// ── Aba 3: Destaques ──────────────────────────────────────────────────────────

function HighlightsTab({ matches }: { matches: MatchFull[] }) {
  const t = useTranslations("portal.highlights");
  const [copied, setCopied] = useState<string | null>(null);

  const highlighted = matches.filter(m => m.status === "finished" && m.mvp_photo_url);

  async function handleShare(m: MatchFull) {
    const athleteName = m.mvp_athlete?.name ?? "MVP";
    const url = typeof window !== "undefined" ? window.location.href : "";

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as Navigator & { share: (d: object) => Promise<void> }).share({
          title: t("shareTitle"),
          text: t("shareText", { name: athleteName }),
          url,
        });
        return;
      } catch { /* cancelado */ }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(m.id);
      setTimeout(() => setCopied(null), 2500);
    } catch { /* indisponível */ }
  }

  if (highlighted.length === 0) {
    return (
      <div className="py-20 px-6 text-center flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <Trophy size={32} className="text-zinc-700" />
        </div>
        <p className="text-zinc-600 text-sm max-w-xs leading-relaxed">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-4">
      {highlighted.map(m => {
        const isCopied = copied === m.id;
        return (
          <div key={m.id} className="flex flex-col">
            <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4/5" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.mvp_photo_url!} alt={m.mvp_athlete?.name ?? "MVP"} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 px-5 pb-6 pointer-events-none">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Trophy size={12} className="text-yellow-400" strokeWidth={2.5} />
                  <span className="text-yellow-400 text-[10px] font-black uppercase tracking-widest">{t("mvpBadge")}</span>
                </div>
                <p className="text-white font-black text-2xl leading-tight drop-shadow-lg">{m.mvp_athlete?.name ?? "—"}</p>
                <p className="text-zinc-300 text-sm font-semibold mt-1">
                  {m.team_a?.name ?? "?"}{" "}
                  <span className="text-yellow-400 font-black tabular-nums">{m.score_a} × {m.score_b}</span>{" "}
                  {m.team_b?.name ?? "?"}
                </p>
              </div>
            </div>
            <div className="px-4 pt-3">
              <button
                onClick={() => handleShare(m)}
                className="w-full py-4 rounded-xl bg-yellow-400 text-black font-black text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
              >
                {isCopied
                  ? <><Check size={16} strokeWidth={3} />{t("copied")}</>
                  : <><Share2 size={16} strokeWidth={2.5} />{t("share")}</>
                }
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function PublicTournamentPage() {
  const params = useParams();
  const tournamentId = params.id as string;

  const t = useTranslations("portal");

  const [tab, setTab]               = useState<Tab>("standings");
  const [tournament, setTournament] = useState<TournamentInfo | null>(null);
  const [matches, setMatches]       = useState<MatchFull[]>([]);
  const [standings, setStandings]   = useState<TeamStanding[]>([]);
  const [loading, setLoading]       = useState(true);

  const TABS: { key: Tab; label: string }[] = [
    { key: "standings",  label: t("tabs.standings") },
    { key: "matches",    label: t("tabs.matches") },
    { key: "highlights", label: t("tabs.highlights") },
  ];

  useEffect(() => {
    async function load() {
      const [{ data: tData }, { data: mData }] = await Promise.all([
        supabase
          .from("tournaments")
          .select("id, name, status, team_count, round_count, start_date")
          .eq("id", tournamentId)
          .single(),
        supabase
          .from("matches")
          .select(`
            id, round_number, status, score_a, score_b, scheduled_at,
            mvp_photo_url, mvp_athlete_id,
            team_a:teams!matches_team_a_id_fkey ( id, name ),
            team_b:teams!matches_team_b_id_fkey ( id, name ),
            mvp_athlete:athletes!matches_mvp_athlete_id_fkey ( id, name, jersey_number )
          `)
          .eq("tournament_id", tournamentId)
          .order("round_number", { ascending: true }),
      ]);

      if (tData) setTournament(tData as TournamentInfo);
      if (mData) {
        const typed = mData as unknown as MatchFull[];
        setMatches(typed);
        setStandings(computeStandings(typed));
      }
      setLoading(false);
    }
    load();
  }, [tournamentId]);

  const highlightCount = matches.filter(m => m.status === "finished" && m.mvp_photo_url).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-zinc-800 border-t-yellow-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Trophy size={48} className="text-zinc-800" />
        <p className="text-zinc-500 font-semibold">{t("notFound")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">

        {/* Header fixo */}
        <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-md border-b border-zinc-900">
          <div className="flex items-center gap-3 px-5 pt-5 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0">
              <Trophy size={18} className="text-yellow-400" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest leading-none mb-0.5">
                {t("championship")}
              </p>
              <h1 className="text-white font-black text-lg leading-tight truncate">{tournament.name}</h1>
            </div>
            {tournament.status === "active" && (
              <span className="shrink-0 flex items-center gap-1.5 text-yellow-400 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                {t("live")}
              </span>
            )}
          </div>

          <div className="flex border-b border-zinc-900">
            {TABS.map(({ key, label }) => {
              const isActive = tab === key;
              const badge = key === "highlights" && highlightCount > 0 ? highlightCount : null;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-xs font-bold border-b-2 -mb-px transition-colors ${
                    isActive ? "text-yellow-400 border-yellow-400" : "text-zinc-600 border-transparent hover:text-zinc-400"
                  }`}
                >
                  {label}
                  {badge !== null && (
                    <span className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center leading-none ${
                      isActive ? "bg-yellow-400 text-black" : "bg-zinc-800 text-zinc-500"
                    }`}>{badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conteúdo das abas */}
        <div className="flex-1">
          {tab === "standings"  && <StandingsTab standings={standings} />}
          {tab === "matches"    && <MatchesTab matches={matches} />}
          {tab === "highlights" && <HighlightsTab matches={matches} />}
        </div>

        {/* Rodapé com seletor de idioma */}
        <div className="py-5 px-5 flex items-center justify-between border-t border-zinc-900/50">
          <p className="text-zinc-800 text-[10px] font-black tracking-widest uppercase">Coliseum</p>
          <LanguageSwitcher variant="icon" />
        </div>
      </div>
    </div>
  );
}

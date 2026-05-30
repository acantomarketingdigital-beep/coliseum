"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Layers, Trophy, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { generateRoundRobin, previewStats } from "@/lib/tournament-generator";
import type { GeneratedRound } from "@/lib/tournament-generator";

interface TeamOption { id: string; name: string; }
type Step = "form" | "preview";

// ── Página de criação de campeonato ──────────────────────────────────────────

export default function NovoCampeonatoPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();

  // Form state
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingTeams, setLoadingTeams] = useState(true);

  // Preview state
  const [rounds, setRounds] = useState<GeneratedRound[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);

  // Save state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Carrega times da arena ────────────────────────────────────────────────

  useEffect(() => {
    if (!profile?.arena_id) return;
    supabase
      .from("teams")
      .select("id, name")
      .eq("arena_id", profile.arena_id)
      .order("name")
      .then(({ data }) => {
        if (data) setTeams(data as TeamOption[]);
        setLoadingTeams(false);
      });
  }, [profile?.arena_id]);

  // ── Selecionar/deselecionar time ──────────────────────────────────────────

  function toggleTeam(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setError(null);
  }

  function selectAll() { setSelectedIds(new Set(teams.map((t) => t.id))); }
  function clearAll()  { setSelectedIds(new Set()); }

  // ── Gerar tabela (step 1 → step 2) ───────────────────────────────────────

  function handleGenerate() {
    if (!name.trim())        { setError("Informe o nome do campeonato."); return; }
    if (selectedIds.size < 2){ setError("Selecione pelo menos 2 times."); return; }

    const schedule = generateRoundRobin(Array.from(selectedIds));
    setRounds(schedule.rounds);
    setTotalMatches(schedule.totalMatches);
    setStep("preview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Salvar campeonato + partidas ──────────────────────────────────────────

  async function handleSave() {
    if (!profile?.arena_id) return;
    setSaving(true);
    setError(null);

    try {
      const selectedTeamIds = Array.from(selectedIds);

      // 1. Insere o torneio
      const { data: tournament, error: tErr } = await supabase
        .from("tournaments")
        .insert({
          arena_id: profile.arena_id,
          name: name.trim(),
          format: "round_robin",
          sport: "volleyball",
          start_date: startDate || null,
          status: "active",
          team_count: selectedTeamIds.length,
          round_count: rounds.length,
        })
        .select()
        .single();

      if (tErr) throw tErr;

      // 2. Batch insert das partidas
      const matchRows = rounds.flatMap((round) =>
        round.matches.map((match) => {
          let scheduledAt: string | null = null;
          if (startDate) {
            const d = new Date(startDate + "T10:00:00");
            d.setDate(d.getDate() + (round.roundNumber - 1) * 7); // semanal
            scheduledAt = d.toISOString();
          }
          return {
            arena_id: profile.arena_id!,
            tournament_id: tournament.id,
            round_number: round.roundNumber,
            team_a_id: match.teamAId,
            team_b_id: match.teamBId,
            status: "scheduled" as const,
            sport: "volleyball" as const,
            score_a: 0,
            score_b: 0,
            sync_status: "pending" as const,
            scheduled_at: scheduledAt,
          };
        })
      );

      const { error: mErr } = await supabase.from("matches").insert(matchRows);
      if (mErr) throw mErr;

      router.push("/dashboard/campeonatos");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar campeonato.";
      setError(msg);
      setSaving(false);
    }
  }

  // ── Lookup nome do time ───────────────────────────────────────────────────

  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t.name]));

  // Preview instantâneo dos números
  const { rounds: previewRounds, matches: previewMatches } = previewStats(selectedIds.size);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 text-sm animate-arena-pulse">Carregando…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-zinc-900 px-4 sm:px-6 pt-6 pb-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => (step === "preview" ? setStep("form") : router.back())}
            className="text-zinc-400 text-sm mb-3 flex items-center gap-1 hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 12L5 7l4-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
            {step === "preview" ? "Voltar e Editar" : "Voltar"}
          </button>
          <h1 className="text-white font-black text-2xl tracking-tight">Novo Campeonato</h1>
          <div className="flex items-center gap-2 mt-2">
            {(["form", "preview"] as Step[]).map((s, idx) => (
              <div key={s} className="flex items-center gap-2">
                {idx > 0 && <div className="w-8 h-px bg-zinc-800" />}
                <span className={`flex items-center gap-1.5 text-xs font-bold ${step === s ? "text-yellow-400" : "text-zinc-600"}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${step === s ? "bg-yellow-400 text-black" : "bg-zinc-800 text-zinc-500"}`}>
                    {idx + 1}
                  </span>
                  {s === "form" ? "Configuração" : "Preview"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {/* ══════════════════════════════════════════════════════════════════
            PASSO 1 — FORMULÁRIO
        ══════════════════════════════════════════════════════════════════ */}
        {step === "form" && (
          <div className="flex flex-col gap-6">
            {/* Nome + data */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wide">
                  Nome do Campeonato *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(null); }}
                  placeholder="Ex: Copa Arena Verão 2025"
                  autoFocus
                  className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl px-4 py-3 text-base font-semibold focus:outline-none focus:border-yellow-400 transition-colors placeholder-zinc-600"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wide">
                  Data de Início{" "}
                  <span className="text-zinc-600 normal-case">(opcional — rodadas agendadas semanalmente)</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-yellow-400 transition-colors"
                />
              </div>

              {/* Formato fixo */}
              <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-xl">
                <Trophy size={14} className="text-yellow-400 shrink-0" />
                <span className="text-zinc-400 text-xs">
                  Formato:{" "}
                  <strong className="text-white">Round Robin — Todos contra Todos</strong>
                </span>
              </div>
            </div>

            {/* Seleção de times */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-white font-bold text-base">Times Participantes</h2>
                  <p className="text-zinc-500 text-xs mt-0.5">Selecione mínimo 2 times</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-yellow-400 font-black text-xl">{selectedIds.size}</span>
                  <div className="flex gap-1">
                    <button onClick={selectAll} className="text-[10px] text-zinc-500 hover:text-white px-2 py-1 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors font-semibold">
                      Todos
                    </button>
                    <button onClick={clearAll} className="text-[10px] text-zinc-500 hover:text-white px-2 py-1 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors font-semibold">
                      Limpar
                    </button>
                  </div>
                </div>
              </div>

              {loadingTeams ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 bg-zinc-900 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : teams.length === 0 ? (
                <div className="text-center py-10 bg-zinc-900 border border-zinc-800 rounded-2xl">
                  <Users size={32} className="text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-500 text-sm font-semibold">Nenhum time cadastrado</p>
                  <p className="text-zinc-600 text-xs mt-1">Cadastre times antes de criar um campeonato</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {teams.map((team) => {
                    const selected = selectedIds.has(team.id);
                    return (
                      <button
                        key={team.id}
                        onClick={() => toggleTeam(team.id)}
                        className={`
                          relative p-4 rounded-xl border text-left transition-all duration-100
                          ${selected
                            ? "border-yellow-400 bg-yellow-400/10 shadow-[0_0_12px_rgba(250,204,21,0.1)]"
                            : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                          }
                        `}
                      >
                        {selected && (
                          <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center shrink-0">
                            <Check size={11} strokeWidth={3} className="text-black" />
                          </span>
                        )}
                        <span
                          className={`font-black text-sm block truncate pr-7 ${
                            selected ? "text-yellow-400" : "text-zinc-300"
                          }`}
                        >
                          {team.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Stats preview instantâneo */}
            {selectedIds.size >= 2 && (
              <div className="flex items-center gap-0 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                {[
                  { icon: Users,  value: selectedIds.size,  label: "times"   },
                  { icon: Layers, value: previewRounds,     label: "rodadas" },
                  { icon: Trophy, value: previewMatches,    label: "jogos"   },
                ].map(({ icon: Icon, value, label }, i) => (
                  <div key={label} className={`flex-1 flex flex-col items-center py-4 ${i < 2 ? "border-r border-zinc-800" : ""}`}>
                    <Icon size={14} className="text-zinc-500 mb-1" strokeWidth={2} />
                    <p className="text-yellow-400 font-black text-2xl leading-none">{value}</p>
                    <p className="text-zinc-600 text-[10px] uppercase font-semibold mt-1">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {error && <p className="text-red-400 text-sm text-center font-semibold">{error}</p>}

            <button
              onClick={handleGenerate}
              disabled={selectedIds.size < 2 || !name.trim()}
              className="w-full py-5 rounded-2xl bg-yellow-400 text-black font-black text-lg disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity"
            >
              Gerar Tabela de Jogos
              <ChevronRight size={22} strokeWidth={3} />
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PASSO 2 — PREVIEW
        ══════════════════════════════════════════════════════════════════ */}
        {step === "preview" && (
          <div className="flex flex-col gap-5">
            {/* Cabeçalho do campeonato */}
            <div className="bg-zinc-900 border border-yellow-400/20 rounded-2xl p-5">
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-1">
                Round Robin · Preview
              </p>
              <h2 className="text-white font-black text-xl mb-1">{name}</h2>
              {startDate && (
                <p className="text-zinc-500 text-xs mb-3">
                  Início: {new Date(startDate + "T12:00:00").toLocaleDateString("pt-BR")} · Rodadas semanais
                </p>
              )}
              <div className="flex items-center gap-4 text-sm">
                <span className="text-zinc-400">{selectedIds.size} times</span>
                <span className="text-zinc-700">·</span>
                <span className="text-zinc-400">{rounds.length} rodadas</span>
                <span className="text-zinc-700">·</span>
                <span className="text-yellow-400 font-bold">{totalMatches} jogos</span>
              </div>
            </div>

            {/* Rodadas */}
            <div className="flex flex-col gap-3">
              {rounds.map((round) => (
                <div
                  key={round.roundNumber}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
                >
                  {/* Cabeçalho da rodada */}
                  <div className="px-4 py-3 bg-zinc-800/40 border-b border-zinc-800 flex items-center justify-between">
                    <span className="text-white text-xs font-black uppercase tracking-widest">
                      Rodada {round.roundNumber}
                    </span>
                    <span className="text-zinc-600 text-[10px] font-semibold">
                      {round.matches.length} {round.matches.length === 1 ? "jogo" : "jogos"}
                      {round.byeTeamId ? " + 1 folga" : ""}
                    </span>
                  </div>

                  {/* Confrontos */}
                  <div className="divide-y divide-zinc-800/50">
                    {round.matches.map((match, i) => (
                      <div key={i} className="px-4 py-3.5 flex items-center gap-3">
                        <span className="text-white font-bold text-sm flex-1 truncate">
                          {teamMap[match.teamAId]}
                        </span>
                        <span className="text-zinc-600 font-black text-[10px] tracking-widest shrink-0">
                          VS
                        </span>
                        <span className="text-white font-bold text-sm flex-1 truncate text-right">
                          {teamMap[match.teamBId]}
                        </span>
                      </div>
                    ))}

                    {/* Folga */}
                    {round.byeTeamId && (
                      <div className="px-4 py-3 flex items-center gap-2 bg-zinc-800/20">
                        <span className="text-lg">🛌</span>
                        <span className="text-zinc-500 text-xs font-semibold">
                          FOLGA: {teamMap[round.byeTeamId]}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="text-red-400 text-sm text-center font-semibold">{error}</p>}

            {/* Ação de salvar */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-5 rounded-2xl bg-yellow-400 text-black font-black text-lg disabled:opacity-60 transition-opacity"
            >
              {saving
                ? `Salvando ${totalMatches} jogos…`
                : "Salvar Campeonato e Agendar Partidas"}
            </button>

            <p className="text-center text-zinc-600 text-xs">
              Todas as {totalMatches} partidas serão criadas com status <strong className="text-zinc-500">Agendada</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

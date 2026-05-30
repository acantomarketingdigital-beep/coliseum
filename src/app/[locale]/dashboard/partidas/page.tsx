"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Calendar, CheckCircle2, ChevronRight, Clock4,
  Plus, RefreshCw, Trophy, User, XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { MatchStatus, SportType } from "@/types/database";

// ── Tipos ────────────────────────────────────────────────────────────────────

interface MatchRow {
  id: string;
  team_a_id: string;
  team_b_id: string;
  referee_id: string | null;
  arena_id: string;
  status: MatchStatus;
  sport: SportType;
  score_a: number;
  score_b: number;
  scheduled_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  mvp_athlete_id: string | null;
  mvp_photo_url: string | null;
  team_a: { id: string; name: string } | null;
  team_b: { id: string; name: string } | null;
  referee: { id: string; name: string } | null;
  mvp_athlete: { id: string; name: string; jersey_number: number } | null;
}

interface SelectOption { id: string; name: string; }
type StatusFilter = "all" | MatchStatus;

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_ORDER: Record<MatchStatus, number> = {
  in_progress: 0, scheduled: 1, finished: 2, cancelled: 3,
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

// ── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MatchStatus }) {
  switch (status) {
    case "in_progress":
      return (
        <span className="flex items-center gap-1.5 text-yellow-400 text-xs font-bold tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-arena-pulse shrink-0" />AO VIVO
        </span>
      );
    case "scheduled":
      return <span className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold"><Clock4 size={11} strokeWidth={2.5} />AGENDADA</span>;
    case "finished":
      return <span className="flex items-center gap-1.5 text-zinc-500 text-xs font-semibold"><CheckCircle2 size={11} strokeWidth={2.5} />ENCERRADA</span>;
    case "cancelled":
      return <span className="flex items-center gap-1.5 text-red-500/60 text-xs font-semibold"><XCircle size={11} strokeWidth={2.5} />CANCELADA</span>;
  }
}

// ── Modal de foto MVP (admin — câmera da recepção) ────────────────────────────

interface PhotoModalProps {
  matchId: string;
  mvpName: string;
  onClose: () => void;
  onUploaded: (url: string) => void;
}

function PhotoModal({ matchId, mvpName, onClose, onUploaded }: PhotoModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const ext = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg";
      const path = `${matchId}/mvp_${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("mvp-photos")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from("mvp-photos").getPublicUrl(path);

      const { error: updateErr } = await supabase
        .from("matches")
        .update({ mvp_photo_url: publicUrl })
        .eq("id", matchId);

      if (updateErr) throw updateErr;
      onUploaded(publicUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro no upload. Tente novamente.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4">
      <div className="w-full max-w-xs bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-[stepSlideIn_0.2s_ease-out]">
        <div className="px-6 pt-6 pb-4 border-b border-zinc-800 text-center">
          <p className="text-xs tracking-[0.2em] uppercase text-zinc-500 font-semibold mb-2">
            Atleta Destaque
          </p>
          <p className="text-yellow-400 font-black text-lg">{mvpName}</p>
        </div>

        <div className="px-6 py-6 flex flex-col items-center gap-5">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-14 h-14 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-400 text-sm font-semibold">Enviando foto…</p>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full py-8 rounded-2xl bg-zinc-800 border border-zinc-700 hover:border-yellow-400/50 transition-all flex flex-col items-center gap-3 active:scale-[0.98]"
            >
              <span className="text-5xl">📸</span>
              <span className="text-white font-bold text-base">Abrir Câmera</span>
              <span className="text-zinc-500 text-xs">Posicione o atleta na moldura</span>
            </button>
          )}

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button
            onClick={onClose}
            disabled={uploading}
            className="text-zinc-500 text-sm font-semibold hover:text-zinc-300 transition-colors py-1"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Match Card ────────────────────────────────────────────────────────────────

interface MatchCardProps {
  match: MatchRow;
  isAdmin: boolean;
  onPhotoClick: (matchId: string, mvpName: string) => void;
}

function MatchCard({ match, isAdmin, onPhotoClick }: MatchCardProps) {
  const teamAName = match.team_a?.name ?? "Time A";
  const teamBName = match.team_b?.name ?? "Time B";
  const isLive = match.status === "in_progress";
  const canAccess = isLive || match.status === "scheduled";
  const needsPhoto = isAdmin &&
    match.status === "finished" &&
    match.mvp_athlete_id !== null &&
    !match.mvp_photo_url;

  const mvpLabel = match.mvp_athlete
    ? `#${match.mvp_athlete.jersey_number} ${match.mvp_athlete.name}`
    : null;

  return (
    <div className={`bg-zinc-900 border rounded-2xl p-5 flex flex-col gap-3 transition-all duration-150 ${isLive ? "border-yellow-400/25 shadow-[0_0_24px_rgba(250,204,21,0.06)]" : needsPhoto ? "border-yellow-400/20" : "border-zinc-800"}`}>
      {/* Status + placar ao vivo */}
      <div className="flex items-center justify-between">
        <StatusBadge status={match.status} />
        {isLive && (
          <span className="font-display font-black text-white text-xl tabular-nums">
            {match.score_a}<span className="text-zinc-600 mx-1 font-black text-base">×</span>{match.score_b}
          </span>
        )}
        {match.status === "finished" && match.mvp_photo_url && (
          <span title="Foto registrada" className="text-lg">🏆</span>
        )}
      </div>

      {/* Times */}
      <div>
        <p className="text-white font-black text-xl tracking-tight leading-tight">{teamAName}</p>
        <p className="text-zinc-600 text-[10px] font-black tracking-[0.25em] my-1 uppercase">vs</p>
        <p className="text-white font-black text-xl tracking-tight leading-tight">{teamBName}</p>
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-zinc-500 text-xs">
        <span className="flex items-center gap-1">
          <Calendar size={11} strokeWidth={2} />
          {formatDate(match.scheduled_at ?? match.started_at)}
        </span>
        {isAdmin && match.referee && (
          <span className="flex items-center gap-1 truncate">
            <User size={11} strokeWidth={2} />
            {match.referee.name}
          </span>
        )}
        {mvpLabel && (
          <span className="flex items-center gap-1 text-yellow-400/70">
            ⚡ {mvpLabel}
          </span>
        )}
      </div>

      {/* Botão de ação principal */}
      {isAdmin ? (
        <Link
          href={canAccess ? `/partida/${match.id}` : "#"}
          className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-bold transition-colors ${canAccess ? "border-zinc-700 text-zinc-300 hover:border-yellow-400/50 hover:text-yellow-400" : "border-zinc-800 text-zinc-600 cursor-default pointer-events-none"}`}
        >
          {canAccess ? "Abrir Súmula" : match.status === "finished" ? "Súmula Encerrada" : "Cancelada"}
          {canAccess && <ChevronRight size={14} strokeWidth={2.5} />}
        </Link>
      ) : (
        canAccess ? (
          <Link href={`/partida/${match.id}`} className="block w-full py-4 rounded-xl bg-yellow-400 text-black font-black text-base text-center tracking-wide">
            Acessar Súmula
          </Link>
        ) : (
          <div className="w-full py-4 rounded-xl bg-zinc-800 text-zinc-600 font-bold text-sm text-center">
            {match.status === "finished" ? "Súmula Encerrada" : "Cancelada"}
          </div>
        )
      )}

      {/* Botão 📸 Fotografar Destaque (admin — partida encerrada com MVP sem foto) */}
      {needsPhoto && (
        <button
          onClick={() => onPhotoClick(match.id, mvpLabel ?? "Atleta Destaque")}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-400/10 border border-yellow-400/40 text-yellow-400 font-bold text-sm hover:bg-yellow-400/20 transition-colors"
        >
          📸 Fotografar Atleta Destaque
        </button>
      )}

      {/* Indicador: foto já registrada */}
      {isAdmin && match.status === "finished" && match.mvp_photo_url && mvpLabel && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={match.mvp_photo_url} alt="MVP" className="w-8 h-8 rounded-lg object-cover border border-zinc-700 shrink-0" />
          <div className="min-w-0">
            <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wide">Destaque</p>
            <p className="text-white text-xs font-bold truncate">{mvpLabel}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Modal de criação (admin) ──────────────────────────────────────────────────

function CreateMatchModal({ teams, referees, arenaId, onClose, onCreated }: {
  teams: SelectOption[]; referees: SelectOption[];
  arenaId: string; onClose: () => void; onCreated: () => void;
}) {
  const [form, setForm] = useState({ teamAId: "", teamBId: "", refereeId: "", scheduledAt: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isValid = form.teamAId && form.teamBId && form.teamAId !== form.teamBId;
  const sel = "w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-yellow-400 transition-colors";
  const patch = (k: string, v: string) => { setForm((f) => ({ ...f, [k]: v })); setError(null); };

  async function submit() {
    if (!isValid) { setError("Selecione dois times distintos."); return; }
    setSaving(true);
    const { error: e } = await supabase.from("matches").insert({
      arena_id: arenaId, team_a_id: form.teamAId, team_b_id: form.teamBId,
      referee_id: form.refereeId || null, scheduled_at: form.scheduledAt || null,
      status: "scheduled", sport: "volleyball", score_a: 0, score_b: 0, sync_status: "pending",
    });
    setSaving(false);
    if (e) { setError(e.message); return; }
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-[stepSlideIn_0.2s_ease-out]">
        <div className="px-6 pt-6 pb-4 border-b border-zinc-800">
          <p className="text-xs tracking-[0.2em] uppercase text-zinc-500 font-semibold mb-1">Vôlei de Quadra</p>
          <h2 className="text-white font-black text-xl">Nova Partida</h2>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wide">Time A (esquerda)</label>
            <select value={form.teamAId} onChange={(e) => patch("teamAId", e.target.value)} className={sel}>
              <option value="">Selecionar time…</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wide">Time B (direita)</label>
            <select value={form.teamBId} onChange={(e) => patch("teamBId", e.target.value)} className={sel}>
              <option value="">Selecionar time…</option>
              {teams.filter((t) => t.id !== form.teamAId).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wide">
              Árbitro <span className="text-zinc-600 normal-case">(opcional)</span>
            </label>
            <select value={form.refereeId} onChange={(e) => patch("refereeId", e.target.value)} className={sel}>
              <option value="">Sem árbitro definido</option>
              {referees.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-zinc-400 text-xs font-semibold mb-2 uppercase tracking-wide">
              Data e Hora <span className="text-zinc-600 normal-case">(opcional)</span>
            </label>
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => patch("scheduledAt", e.target.value)} className={sel} />
          </div>
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-semibold hover:text-white transition-colors">Cancelar</button>
          <button onClick={submit} disabled={saving || !isValid} className="flex-[2] py-3 rounded-xl bg-yellow-400 text-black font-black text-sm disabled:opacity-50">
            {saving ? "Criando…" : "Criar Partida"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tabs de filtro ────────────────────────────────────────────────────────────

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "in_progress", label: "Ao Vivo" },
  { key: "scheduled", label: "Agendadas" },
  { key: "finished", label: "Encerradas" },
];

function EmptyState({ isAdmin, filter }: { isAdmin: boolean; filter: StatusFilter }) {
  const msgs: Record<string, string> = {
    in_progress: "Nenhuma partida ao vivo agora.",
    scheduled: "Nenhuma partida agendada.",
    finished: "Nenhuma partida encerrada.",
    cancelled: "Nenhuma partida cancelada.",
    all: isAdmin ? "Crie a primeira partida acima." : "Aguarde o administrador agendar uma partida.",
  };
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
        <Trophy size={28} className="text-zinc-600" />
      </div>
      <p className="text-white font-bold text-lg mb-2">
        {isAdmin && filter === "all" ? "Nenhuma partida ainda" : "Sem partidas"}
      </p>
      <p className="text-zinc-500 text-sm max-w-xs">{msgs[filter] ?? msgs.all}</p>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function PartidasPage() {
  const { user, profile, loading: authLoading } = useAuth();

  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [teams, setTeams] = useState<SelectOption[]>([]);
  const [referees, setReferees] = useState<SelectOption[]>([]);
  const [photoModal, setPhotoModal] = useState<{ matchId: string; mvpName: string } | null>(null);

  const isAdmin = profile?.role === "arena_admin";

  // ── Fetch matches ──────────────────────────────────────────────────────────

  const fetchMatches = useCallback(async () => {
    if (!profile || !user) return;

    let query = supabase.from("matches").select(`
      *,
      team_a:teams!matches_team_a_id_fkey ( id, name ),
      team_b:teams!matches_team_b_id_fkey ( id, name ),
      referee:users!matches_referee_id_fkey ( id, name ),
      mvp_athlete:athletes!matches_mvp_athlete_id_fkey ( id, name, jersey_number )
    `);

    if (isAdmin) {
      query = query.eq("arena_id", profile.arena_id!);
    } else {
      query = query.eq("referee_id", user.id).in("status", ["scheduled", "in_progress"]);
    }

    query = query.order("scheduled_at", { ascending: !isAdmin });

    const { data } = await query;
    if (data) {
      const sorted = (data as unknown as MatchRow[]).sort(
        (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      );
      setMatches(sorted);
    }
    setLoading(false);
    setRefreshing(false);
  }, [profile, user, isAdmin]);

  const fetchOptions = useCallback(async () => {
    if (!isAdmin || !profile?.arena_id) return;
    const [{ data: t }, { data: r }] = await Promise.all([
      supabase.from("teams").select("id, name").eq("arena_id", profile.arena_id).order("name"),
      supabase.from("users").select("id, name").eq("arena_id", profile.arena_id).eq("role", "referee").order("name"),
    ]);
    setTeams((t as SelectOption[]) ?? []);
    setReferees((r as SelectOption[]) ?? []);
  }, [isAdmin, profile?.arena_id]);

  useEffect(() => {
    if (!authLoading && profile) { fetchMatches(); fetchOptions(); }
  }, [authLoading, profile, fetchMatches, fetchOptions]);

  function handleRefresh() { setRefreshing(true); fetchMatches(); }

  function handlePhotoUploaded(matchId: string, url: string) {
    setMatches((prev) =>
      prev.map((m) => m.id === matchId ? { ...m, mvp_photo_url: url } : m)
    );
    setPhotoModal(null);
  }

  const filteredMatches = activeFilter === "all" ? matches : matches.filter((m) => m.status === activeFilter);
  const liveCount = matches.filter((m) => m.status === "in_progress").length;
  const pendingPhotos = matches.filter((m) => m.status === "finished" && m.mvp_athlete_id && !m.mvp_photo_url).length;

  if (authLoading || (!profile && loading)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 text-sm animate-arena-pulse">Carregando…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Modal de foto */}
      {photoModal && (
        <PhotoModal
          matchId={photoModal.matchId}
          mvpName={photoModal.mvpName}
          onClose={() => setPhotoModal(null)}
          onUploaded={(url) => handlePhotoUploaded(photoModal.matchId, url)}
        />
      )}

      {/* Header */}
      <div className="border-b border-zinc-900 px-4 sm:px-6 pt-6 pb-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-white font-black text-2xl tracking-tight">Partidas</h1>
              <div className="flex items-center gap-3 mt-0.5">
                {liveCount > 0 && (
                  <p className="text-yellow-400 text-xs font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-arena-pulse inline-block" />
                    {liveCount} ao vivo
                  </p>
                )}
                {isAdmin && pendingPhotos > 0 && (
                  <p className="text-yellow-400/80 text-xs font-semibold">
                    📸 {pendingPhotos} {pendingPhotos === 1 ? "foto pendente" : "fotos pendentes"}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={handleRefresh} disabled={refreshing}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors" title="Atualizar">
                <RefreshCw size={14} strokeWidth={2.5} className={refreshing ? "animate-spin" : ""} />
              </button>
              {isAdmin && (
                <button onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400 text-black font-black text-sm">
                  <Plus size={16} strokeWidth={3} />Nova Partida
                </button>
              )}
            </div>
          </div>

          {/* Filtros (admin) */}
          {isAdmin && (
            <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
              {FILTER_TABS.map(({ key, label }) => {
                const count = key === "all" ? matches.length : matches.filter((m) => m.status === key).length;
                const hasPending = key === "finished" && pendingPhotos > 0;
                return (
                  <button key={key} onClick={() => setActiveFilter(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${activeFilter === key ? "bg-yellow-400 text-black" : "text-zinc-500 hover:text-white hover:bg-zinc-800"}`}>
                    {label}
                    {count > 0 && (
                      <span className={`text-[10px] font-black ${activeFilter === key ? "text-black/60" : "text-zinc-600"}`}>
                        {count}
                      </span>
                    )}
                    {hasPending && <span className="text-[10px]">📸</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl h-44 animate-pulse" />)}
          </div>
        ) : filteredMatches.length === 0 ? (
          <EmptyState isAdmin={isAdmin} filter={activeFilter} />
        ) : (
          <div className="flex flex-col gap-3">
            {filteredMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                isAdmin={isAdmin}
                onPhotoClick={(id, name) => setPhotoModal({ matchId: id, mvpName: name })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal criar partida */}
      {showCreate && profile?.arena_id && (
        <CreateMatchModal
          teams={teams} referees={referees} arenaId={profile.arena_id}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchMatches(); }}
        />
      )}
    </div>
  );
}

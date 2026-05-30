import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import type {
  Match,
  MatchEvent,
  MatchStatus,
  MatchStore,
  Team,
  VolleySnapshot,
} from "@/types/database";

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Regra dos 25 pts (ou 15 no tie-break) com 2 de vantagem
function checkSetWinner(
  scoreA: number,
  scoreB: number,
  isTiebreak: boolean
): "a" | "b" | null {
  const limit = isTiebreak ? 15 : 25;
  if (Math.max(scoreA, scoreB) >= limit && Math.abs(scoreA - scoreB) >= 2) {
    return scoreA > scoreB ? "a" : "b";
  }
  return null;
}

async function syncScore(matchId: string, scoreA: number, scoreB: number) {
  try {
    await supabase
      .from("matches")
      .update({ score_a: scoreA, score_b: scoreB })
      .eq("id", matchId);
  } catch {
    // offline — useOfflineSync sincroniza depois
  }
}

type VolleyKeys =
  | "setsA" | "setsB" | "setScoreA" | "setScoreB"
  | "servingSide" | "setWinner" | "matchWinner" | "isTiebreak"
  | "history" | "needsLineup" | "sideChangeDone" | "sideChangeScore";

const VOLLEY_INITIAL: Pick<MatchStore, VolleyKeys> = {
  setsA: 0,
  setsB: 0,
  setScoreA: 0,
  setScoreB: 0,
  servingSide: null,
  setWinner: null,
  matchWinner: null,
  isTiebreak: false,
  history: [],
  needsLineup: true,
  sideChangeDone: false,
  sideChangeScore: null,
};

export const useMatchStore = create<MatchStore>()(
  devtools(
    (set, get) => ({
      // ── Estado base ─────────────────────────────────────────────────────────
      activeMatch: null,
      teamA: null,
      teamB: null,
      events: [],
      isOffline: false,
      pendingSyncEvents: [],
      ...VOLLEY_INITIAL,

      // ── Inicialização ───────────────────────────────────────────────────────
      setActiveMatch: (match, teamA, teamB) =>
        set(
          { activeMatch: match, teamA, teamB, events: [], ...VOLLEY_INITIAL },
          false,
          "setActiveMatch"
        ),

      // ── Evento genérico ─────────────────────────────────────────────────────
      addEvent: (eventData) => {
        const event: MatchEvent = {
          ...eventData,
          id: uid(),
          createdAt: new Date().toISOString(),
        };
        set(
          (state) => ({
            events: [...state.events, event],
            pendingSyncEvents: state.isOffline
              ? [...state.pendingSyncEvents, event]
              : state.pendingSyncEvents,
          }),
          false,
          "addEvent"
        );
      },

      // ── Marcar ponto (lógica de vôlei de quadra) ─────────────────────────────
      addPoint: (side) => {
        const state = get();
        if (!state.activeMatch || state.matchWinner || state.setWinner) return;

        // Snapshot para undo
        const snapshot: VolleySnapshot = {
          setScoreA: state.setScoreA,
          setScoreB: state.setScoreB,
          setsA: state.setsA,
          setsB: state.setsB,
          servingSide: state.servingSide,
          setWinner: null,
          matchWinner: null,
          isTiebreak: state.isTiebreak,
          sideChangeDone: state.sideChangeDone,
          sideChangeScore: state.sideChangeScore,
        };

        const newScoreA = side === "a" ? state.setScoreA + 1 : state.setScoreA;
        const newScoreB = side === "b" ? state.setScoreB + 1 : state.setScoreB;

        // Rally point: quem marca recebe o saque
        const newServing: "a" | "b" = side;

        // Troca de lado no set decisivo: quando um time atinge 8 pontos
        const shouldChangeSide =
          state.isTiebreak &&
          !state.sideChangeDone &&
          Math.max(newScoreA, newScoreB) >= 8;

        const winner = checkSetWinner(newScoreA, newScoreB, state.isTiebreak);

        let newSetsA = state.setsA;
        let newSetsB = state.setsB;
        let matchWinner: "a" | "b" | null = null;

        if (winner) {
          newSetsA = winner === "a" ? state.setsA + 1 : state.setsA;
          newSetsB = winner === "b" ? state.setsB + 1 : state.setsB;
          if (newSetsA >= 3 || newSetsB >= 3) {
            matchWinner = winner;
          }
        }

        const newSideChangeScore = shouldChangeSide
          ? { a: newScoreA, b: newScoreB }
          : state.sideChangeScore;

        set(
          (s) => ({
            history: [...s.history, snapshot],
            setScoreA: newScoreA,
            setScoreB: newScoreB,
            setsA: newSetsA,
            setsB: newSetsB,
            servingSide: newServing,
            setWinner: winner,
            matchWinner,
            sideChangeDone: shouldChangeSide ? true : s.sideChangeDone,
            sideChangeScore: newSideChangeScore,
            activeMatch: s.activeMatch
              ? {
                  ...s.activeMatch,
                  scoreA: newScoreA,
                  scoreB: newScoreB,
                  ...(matchWinner ? { status: "finished" as const } : {}),
                }
              : null,
          }),
          false,
          `addPoint/${side}`
        );

        if (!state.isOffline) {
          syncScore(state.activeMatch.id, newScoreA, newScoreB);

          if (matchWinner) {
            supabase
              .from("matches")
              .update({ status: "finished", finished_at: new Date().toISOString() })
              .eq("id", state.activeMatch.id)
              .then(({ error }) => {
                if (error) console.warn("match finish status:", error.message);
              });
          }

          // Persiste troca de lado e resultado final do set
          const currentSetNum = state.setsA + state.setsB + 1;

          if (shouldChangeSide) {
            supabase
              .from("match_sets")
              .upsert(
                {
                  match_id: state.activeMatch.id,
                  set_number: currentSetNum,
                  side_change_score_a: newScoreA,
                  side_change_score_b: newScoreB,
                },
                { onConflict: "match_id,set_number" }
              )
              .then(({ error }) => {
                if (error) console.warn("side_change sync:", error.message);
              });
          }

          if (winner) {
            supabase
              .from("match_sets")
              .upsert(
                {
                  match_id: state.activeMatch.id,
                  set_number: currentSetNum,
                  score_a: newScoreA,
                  score_b: newScoreB,
                  finished_at: new Date().toISOString(),
                },
                { onConflict: "match_id,set_number" }
              )
              .then(({ error }) => {
                if (error) console.warn("match_sets finish sync:", error.message);
              });
          }
        }
      },

      // ── Desfazer último ponto ────────────────────────────────────────────────
      undoLastPoint: () => {
        const state = get();
        if (state.history.length === 0) return;

        const last = state.history[state.history.length - 1];

        set(
          (s) => ({
            history: s.history.slice(0, -1),
            setScoreA: last.setScoreA,
            setScoreB: last.setScoreB,
            setsA: last.setsA,
            setsB: last.setsB,
            servingSide: last.servingSide,
            setWinner: last.setWinner,
            matchWinner: last.matchWinner,
            isTiebreak: last.isTiebreak,
            sideChangeDone: last.sideChangeDone,
            sideChangeScore: last.sideChangeScore,
            activeMatch: s.activeMatch
              ? { ...s.activeMatch, scoreA: last.setScoreA, scoreB: last.setScoreB }
              : null,
          }),
          false,
          "undoLastPoint"
        );

        if (!state.isOffline && state.activeMatch) {
          syncScore(state.activeMatch.id, last.setScoreA, last.setScoreB);
        }
      },

      // ── Iniciar próximo set ──────────────────────────────────────────────────
      startNextSet: () => {
        const state = get();
        const nextSetNum = state.setsA + state.setsB + 1;
        const isTiebreak = nextSetNum === 5;

        set(
          {
            setScoreA: 0,
            setScoreB: 0,
            setWinner: null,
            servingSide: null,
            isTiebreak,
            needsLineup: true,
            sideChangeDone: false,
            sideChangeScore: null,
          },
          false,
          "startNextSet"
        );

        if (!state.isOffline && state.activeMatch) {
          syncScore(state.activeMatch.id, 0, 0);
          supabase
            .from("match_sets")
            .upsert(
              {
                match_id: state.activeMatch.id,
                set_number: nextSetNum,
                started_at: new Date().toISOString(),
              },
              { onConflict: "match_id,set_number" }
            )
            .then(({ error }) => {
              if (error) console.warn("match_sets start sync:", error.message);
            });
        }
      },

      setServingSide: (side) =>
        set({ servingSide: side }, false, "setServingSide"),

      dismissSetModal: () =>
        set({ setWinner: null }, false, "dismissSetModal"),

      markLineupDone: () =>
        set({ needsLineup: false }, false, "markLineupDone"),

      // ── Ações legadas (compatibilidade com useOfflineSync) ───────────────────
      updateScore: (side, delta) =>
        set(
          (state) => {
            if (!state.activeMatch) return state;
            return {
              activeMatch: {
                ...state.activeMatch,
                scoreA:
                  side === "a"
                    ? Math.max(0, state.activeMatch.scoreA + delta)
                    : state.activeMatch.scoreA,
                scoreB:
                  side === "b"
                    ? Math.max(0, state.activeMatch.scoreB + delta)
                    : state.activeMatch.scoreB,
              },
            };
          },
          false,
          "updateScore"
        ),

      setStatus: (status: MatchStatus) =>
        set(
          (state) => ({
            activeMatch: state.activeMatch
              ? { ...state.activeMatch, status }
              : null,
          }),
          false,
          "setStatus"
        ),

      setMvp: (athleteId, photoUrl) =>
        set(
          (state) => ({
            activeMatch: state.activeMatch
              ? {
                  ...state.activeMatch,
                  mvpAthleteId: athleteId,
                  mvpPhotoUrl: photoUrl ?? null,
                }
              : null,
          }),
          false,
          "setMvp"
        ),

      setOffline: (offline) => set({ isOffline: offline }, false, "setOffline"),

      clearPendingEvents: () =>
        set({ pendingSyncEvents: [] }, false, "clearPendingEvents"),
    }),
    { name: "arena-ops-match" }
  )
);

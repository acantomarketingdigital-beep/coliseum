// ─── Gerado automaticamente do Supabase + tipos de domínio Arena Ops ─────────
// Não edite a Seção 1 manualmente — regenere com: supabase gen types typescript

// ══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 1 — Tipos gerados pelo Supabase (schema público)
// ══════════════════════════════════════════════════════════════════════════════

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      arenas: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string | null
          plan: Database["public"]["Enums"]["arena_plan"]
          status: Database["public"]["Enums"]["arena_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string | null
          plan?: Database["public"]["Enums"]["arena_plan"]
          status?: Database["public"]["Enums"]["arena_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string | null
          plan?: Database["public"]["Enums"]["arena_plan"]
          status?: Database["public"]["Enums"]["arena_status"]
          updated_at?: string
        }
        Relationships: []
      }
      athletes: {
        Row: {
          avatar_url: string | null
          created_at: string
          document_number: string | null
          document_photo_url: string | null
          id: string
          jersey_number: number
          name: string
          team_id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          document_number?: string | null
          document_photo_url?: string | null
          id?: string
          jersey_number: number
          name: string
          team_id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          document_number?: string | null
          document_photo_url?: string | null
          id?: string
          jersey_number?: number
          name?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athletes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_events: {
        Row: {
          athlete_id: string | null
          created_at: string
          description: string | null
          event_ts: number
          id: string
          match_id: string
          minute: number
          sync_status: Database["public"]["Enums"]["sync_status"]
          team_id: string
          type: Database["public"]["Enums"]["event_type"]
        }
        Insert: {
          athlete_id?: string | null
          created_at?: string
          description?: string | null
          event_ts: number
          id?: string
          match_id: string
          minute?: number
          sync_status?: Database["public"]["Enums"]["sync_status"]
          team_id: string
          type: Database["public"]["Enums"]["event_type"]
        }
        Update: {
          athlete_id?: string | null
          created_at?: string
          description?: string | null
          event_ts?: number
          id?: string
          match_id?: string
          minute?: number
          sync_status?: Database["public"]["Enums"]["sync_status"]
          team_id?: string
          type?: Database["public"]["Enums"]["event_type"]
        }
        Relationships: [
          {
            foreignKeyName: "match_events_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_sanctions: {
        Row: {
          athlete_id: string | null
          created_at: string
          id: string
          jersey_number: number | null
          match_id: string
          player_name: string | null
          score_a_at: number | null
          score_b_at: number | null
          set_number: number | null
          team_side: string
          type: Database["public"]["Enums"]["sanction_type"]
        }
        Insert: {
          athlete_id?: string | null
          created_at?: string
          id?: string
          jersey_number?: number | null
          match_id: string
          player_name?: string | null
          score_a_at?: number | null
          score_b_at?: number | null
          set_number?: number | null
          team_side: string
          type: Database["public"]["Enums"]["sanction_type"]
        }
        Update: {
          athlete_id?: string | null
          created_at?: string
          id?: string
          jersey_number?: number | null
          match_id?: string
          player_name?: string | null
          score_a_at?: number | null
          score_b_at?: number | null
          set_number?: number | null
          team_side?: string
          type?: Database["public"]["Enums"]["sanction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "match_sanctions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_sets: {
        Row: {
          created_at: string
          finished_at: string | null
          id: string
          match_id: string
          score_a: number
          score_b: number
          set_number: number
          side_change_score_a: number | null
          side_change_score_b: number | null
          started_at: string | null
        }
        Insert: {
          created_at?: string
          finished_at?: string | null
          id?: string
          match_id: string
          score_a?: number
          score_b?: number
          set_number: number
          side_change_score_a?: number | null
          side_change_score_b?: number | null
          started_at?: string | null
        }
        Update: {
          created_at?: string
          finished_at?: string | null
          id?: string
          match_id?: string
          score_a?: number
          score_b?: number
          set_number?: number
          side_change_score_a?: number | null
          side_change_score_b?: number | null
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_sets_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_substitutions: {
        Row: {
          athlete_in_id: string | null
          athlete_out_id: string | null
          created_at: string
          id: string
          jersey_in: number
          jersey_out: number
          match_id: string
          score_a_at: number | null
          score_b_at: number | null
          set_number: number
          team_side: string
        }
        Insert: {
          athlete_in_id?: string | null
          athlete_out_id?: string | null
          created_at?: string
          id?: string
          jersey_in: number
          jersey_out: number
          match_id: string
          score_a_at?: number | null
          score_b_at?: number | null
          set_number: number
          team_side: string
        }
        Update: {
          athlete_in_id?: string | null
          athlete_out_id?: string | null
          created_at?: string
          id?: string
          jersey_in?: number
          jersey_out?: number
          match_id?: string
          score_a_at?: number | null
          score_b_at?: number | null
          set_number?: number
          team_side?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_substitutions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          arena_id: string
          created_at: string
          finished_at: string | null
          id: string
          mvp_athlete_id: string | null
          mvp_photo_url: string | null
          referee_id: string | null
          scheduled_at: string | null
          score_a: number
          score_b: number
          sport: Database["public"]["Enums"]["sport_type"]
          started_at: string | null
          status: Database["public"]["Enums"]["match_status"]
          sync_status: Database["public"]["Enums"]["sync_status"]
          team_a_id: string
          team_b_id: string
          tournament_id: string | null
          round_number: number | null
          updated_at: string
        }
        Insert: {
          arena_id: string
          created_at?: string
          finished_at?: string | null
          id?: string
          mvp_athlete_id?: string | null
          mvp_photo_url?: string | null
          referee_id?: string | null
          round_number?: number | null
          scheduled_at?: string | null
          score_a?: number
          score_b?: number
          sport?: Database["public"]["Enums"]["sport_type"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          sync_status?: Database["public"]["Enums"]["sync_status"]
          team_a_id: string
          team_b_id: string
          tournament_id?: string | null
          updated_at?: string
        }
        Update: {
          arena_id?: string
          created_at?: string
          finished_at?: string | null
          id?: string
          mvp_athlete_id?: string | null
          mvp_photo_url?: string | null
          referee_id?: string | null
          round_number?: number | null
          scheduled_at?: string | null
          score_a?: number
          score_b?: number
          sport?: Database["public"]["Enums"]["sport_type"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          sync_status?: Database["public"]["Enums"]["sync_status"]
          team_a_id?: string
          team_b_id?: string
          tournament_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_mvp_athlete_id_fkey"
            columns: ["mvp_athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team_a_id_fkey"
            columns: ["team_a_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team_b_id_fkey"
            columns: ["team_b_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      set_lineups: {
        Row: {
          athlete_id: string | null
          created_at: string
          id: string
          is_libero: boolean
          jersey_number: number | null
          match_id: string
          player_name: string | null
          position: number
          set_number: number
          team_side: string
        }
        Insert: {
          athlete_id?: string | null
          created_at?: string
          id?: string
          is_libero?: boolean
          jersey_number?: number | null
          match_id: string
          player_name?: string | null
          position: number
          set_number: number
          team_side: string
        }
        Update: {
          athlete_id?: string | null
          created_at?: string
          id?: string
          is_libero?: boolean
          jersey_number?: number | null
          match_id?: string
          player_name?: string | null
          position?: number
          set_number?: number
          team_side?: string
        }
        Relationships: [
          {
            foreignKeyName: "set_lineups_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          arena_id: string
          coach_name: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          status: string
          tournament_id: string | null
          updated_at: string
        }
        Insert: {
          arena_id: string
          coach_name?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          status?: string
          tournament_id?: string | null
          updated_at?: string
        }
        Update: {
          arena_id?: string
          coach_name?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          status?: string
          tournament_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          arena_id: string
          created_at: string
          format: string
          id: string
          name: string
          round_count: number
          sport: Database["public"]["Enums"]["sport_type"]
          start_date: string | null
          status: string
          team_count: number
          updated_at: string
        }
        Insert: {
          arena_id: string
          created_at?: string
          format?: string
          id?: string
          name: string
          round_count?: number
          sport?: Database["public"]["Enums"]["sport_type"]
          start_date?: string | null
          status?: string
          team_count?: number
          updated_at?: string
        }
        Update: {
          arena_id?: string
          created_at?: string
          format?: string
          id?: string
          name?: string
          round_count?: number
          sport?: Database["public"]["Enums"]["sport_type"]
          start_date?: string | null
          status?: string
          team_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          arena_id: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          pin_code: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          arena_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          name: string
          pin_code?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          arena_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          pin_code?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_arena_id_fkey"
            columns: ["arena_id"]
            isOneToOne: false
            referencedRelation: "arenas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_arena_admin: { Args: { p_arena_id: string }; Returns: boolean }
      my_arena_id: { Args: never; Returns: string }
    }
    Enums: {
      arena_plan: "start" | "pro" | "enterprise"
      arena_status: "active" | "inactive"
      event_type:
        | "goal"
        | "yellow_card"
        | "red_card"
        | "foul"
        | "timeout"
        | "substitution"
        | "point"
      match_status: "scheduled" | "in_progress" | "finished" | "cancelled"
      sport_type: "futsal" | "volleyball" | "basketball" | "handball" | "soccer"
      sanction_type: "warning" | "penalty" | "expulsion" | "disqualification"
      sync_status: "pending" | "synced"
      user_role: "arena_admin" | "referee" | "coach"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]),
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends { Row: infer R } ? R : never

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never

export type Enums<T extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][T]

export const Constants = {
  public: {
    Enums: {
      arena_plan:   ["start", "pro", "enterprise"],
      arena_status: ["active", "inactive"],
      event_type:   ["goal", "yellow_card", "red_card", "foul", "timeout", "substitution", "point"],
      match_status: ["scheduled", "in_progress", "finished", "cancelled"],
      sanction_type: ["warning", "penalty", "expulsion", "disqualification"],
      sport_type:   ["futsal", "volleyball", "basketball", "handball", "soccer"],
      sync_status:  ["pending", "synced"],
      user_role:    ["arena_admin", "referee", "coach"],
    },
  },
} as const

// ══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 2 — Interfaces de domínio (camelCase para uso no frontend)
// ══════════════════════════════════════════════════════════════════════════════

export type ArenaPlan    = Enums<"arena_plan">
export type ArenaStatus  = Enums<"arena_status">
export type UserRole     = Enums<"user_role">
export type MatchStatus  = Enums<"match_status">
export type SportType    = Enums<"sport_type">
export type SyncStatus   = Enums<"sync_status">
export type EventType    = Enums<"event_type">

export interface Arena {
  id: string
  name: string
  plan: ArenaPlan
  status: ArenaStatus
  ownerId: string | null
  createdAt: string
  updatedAt: string
}

export interface AppUser {
  id: string
  arenaId: string | null
  role: UserRole
  name: string
  email: string | null
  pinCode: string | null
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export type TeamStatus = "pending" | "approved" | "rejected"

export interface Team {
  id: string
  arenaId: string
  tournamentId: string | null
  name: string
  coachName: string | null
  logoUrl: string | null
  primaryColor: string | null
  status: TeamStatus
  createdAt: string
  updatedAt: string
}

export interface Athlete {
  id: string
  teamId: string
  name: string
  jerseyNumber: number
  documentNumber: string | null
  documentPhotoUrl: string | null
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface Match {
  id: string
  arenaId: string
  teamAId: string
  teamBId: string
  refereeId: string | null
  tournamentId?: string | null
  roundNumber?: number | null
  status: MatchStatus
  sport: SportType
  scoreA: number
  scoreB: number
  mvpAthleteId: string | null
  mvpPhotoUrl: string | null
  syncStatus: SyncStatus
  scheduledAt: string | null
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface MatchEvent {
  id: string
  matchId: string
  teamId: string
  athleteId: string | null
  type: EventType
  minute: number
  description: string | null
  eventTs: number
  syncStatus: SyncStatus
  createdAt: string
}

export type SanctionType = Enums<"sanction_type">

export interface MatchSet {
  id: string
  matchId: string
  setNumber: number
  scoreA: number
  scoreB: number
  sideChangeScoreA: number | null
  sideChangeScoreB: number | null
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
}

export interface SetLineup {
  id: string
  matchId: string
  setNumber: number
  teamSide: "a" | "b"
  position: number
  jerseyNumber: number | null
  athleteId: string | null
  playerName: string | null
  isLibero: boolean
  createdAt: string
}

export interface MatchSanction {
  id: string
  matchId: string
  teamSide: "a" | "b"
  athleteId: string | null
  jerseyNumber: number | null
  playerName: string | null
  type: SanctionType
  setNumber: number | null
  scoreAAt: number | null
  scoreBAt: number | null
  createdAt: string
}

export type TournamentFormat = "round_robin" | "knockout" | "swiss"
export type TournamentStatus = "draft" | "active" | "finished"

export interface Tournament {
  id: string
  arenaId: string
  name: string
  format: TournamentFormat
  sport: SportType
  startDate: string | null
  status: TournamentStatus
  teamCount: number
  roundCount: number
  createdAt: string
  updatedAt: string
}

export interface MatchSubstitution {
  id: string
  matchId: string
  teamSide: "a" | "b"
  setNumber: number
  jerseyOut: number
  jerseyIn: number
  athleteOutId: string | null
  athleteInId: string | null
  scoreAAt: number | null
  scoreBAt: number | null
  createdAt: string
}

// ══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 3 — Tipos do estado global (Zustand store)
// ══════════════════════════════════════════════════════════════════════════════

/** Snapshot completo do estado de vôlei — usado para desfazer (Undo) */
export interface VolleySnapshot {
  setScoreA: number
  setScoreB: number
  setsA: number
  setsB: number
  servingSide: "a" | "b" | null
  setWinner: "a" | "b" | null
  matchWinner: "a" | "b" | null
  isTiebreak: boolean
  sideChangeDone: boolean
  sideChangeScore: { a: number; b: number } | null
}

export interface MatchStore {
  // ── Dados básicos ─────────────────────────────────────────────────────────
  activeMatch: Match | null
  teamA: Team | null
  teamB: Team | null
  events: MatchEvent[]
  isOffline: boolean
  pendingSyncEvents: MatchEvent[]

  // ── Estado específico de vôlei ─────────────────────────────────────────────
  setsA: number
  setsB: number
  setScoreA: number
  setScoreB: number
  servingSide: "a" | "b" | null
  setWinner: "a" | "b" | null
  matchWinner: "a" | "b" | null
  isTiebreak: boolean
  history: VolleySnapshot[]
  needsLineup: boolean
  sideChangeDone: boolean
  sideChangeScore: { a: number; b: number } | null

  // ── Ações genéricas ────────────────────────────────────────────────────────
  setActiveMatch: (match: Match | null, teamA: Team, teamB: Team) => void
  addEvent: (event: Omit<MatchEvent, "id" | "createdAt">) => void
  updateScore: (side: "a" | "b", delta: number) => void
  setStatus: (status: MatchStatus) => void
  setMvp: (athleteId: string, photoUrl?: string) => void
  setOffline: (offline: boolean) => void
  clearPendingEvents: () => void

  // ── Ações de vôlei ────────────────────────────────────────────────────────
  addPoint: (side: "a" | "b") => void
  undoLastPoint: () => void
  startNextSet: () => void
  setServingSide: (side: "a" | "b") => void
  dismissSetModal: () => void
  markLineupDone: () => void
}

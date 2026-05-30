-- ═══════════════════════════════════════════════════════════════════════════
-- Coliseum — Migração: teams.status + teams.tournament_id
-- Execute no SQL Editor do Supabase (projeto > SQL Editor > New query)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Adicionar coluna status na tabela teams ────────────────────────────────
--    Valores possíveis: 'pending' | 'approved' | 'rejected'
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS status varchar NOT NULL DEFAULT 'pending';

-- ── 2. Adicionar coluna tournament_id (FK para tournaments) ───────────────────
--    Nullable — permite times legados sem campeonato associado
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS tournament_id uuid
    REFERENCES public.tournaments(id) ON DELETE SET NULL;

-- ── 3. Índices para performance ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_teams_tournament_id ON public.teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_teams_status        ON public.teams(status);

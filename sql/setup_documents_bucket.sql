-- ═══════════════════════════════════════════════════════════════════════════
-- Coliseum — Setup: bucket "documents" + migração da tabela athletes
-- Execute no SQL Editor do Supabase (projeto > SQL Editor > New query)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Criar o bucket "documents" (privado) ──────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760,  -- 10 MB por arquivo
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- ── 2. Migração: adicionar campos na tabela athletes (idempotente) ────────────
ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS document_number  varchar,
  ADD COLUMN IF NOT EXISTS document_photo_url text;

-- ── 3. RLS do bucket ─────────────────────────────────────────────────────────

-- Qualquer usuário anônimo pode fazer upload (INSERT) de documentos
-- Necessário para o fluxo de auto-inscrição sem login
CREATE POLICY "documents_anon_insert"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'documents');

-- Somente usuários autenticados (admins) podem visualizar (SELECT) os documentos
CREATE POLICY "documents_auth_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

-- Somente usuários autenticados podem deletar documentos
CREATE POLICY "documents_auth_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');

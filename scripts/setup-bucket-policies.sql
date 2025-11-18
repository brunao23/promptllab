-- =====================================================
-- POLÍTICAS RLS PARA O BUCKET "avatars"
-- =====================================================
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- Ou via API após criar o bucket
-- =====================================================

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Política 1: Permitir leitura pública de avatares
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Política 2: Permitir upload apenas para usuários autenticados
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( 
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Política 3: Permitir atualização apenas para o dono do arquivo
-- O arquivo deve estar no formato: avatars/{user_id}-{timestamp}.{ext}
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING ( 
  bucket_id = 'avatars' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR auth.uid()::text = split_part((storage.foldername(name))[1], '-', 1)
  )
);

-- Política 4: Permitir exclusão apenas para o dono do arquivo
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING ( 
  bucket_id = 'avatars' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR auth.uid()::text = split_part((storage.foldername(name))[1], '-', 1)
  )
);

-- =====================================================
-- VERIFICAR POLÍTICAS CRIADAS
-- =====================================================
-- Execute esta query para verificar se as políticas foram criadas:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';


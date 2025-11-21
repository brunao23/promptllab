-- ============================================
-- CORRIGIR POLICIES RLS PARA user_api_keys
-- Execute no Supabase SQL Editor
-- ============================================

-- Ver policies atuais
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'user_api_keys'
ORDER BY policyname;

-- REMOVER todas as policies antigas
DROP POLICY IF EXISTS "Users can view their own API keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can insert their own API keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON user_api_keys;

-- CRIAR policies corretas

-- SELECT: Usuários podem ver suas próprias API keys
CREATE POLICY "Users can view their own API keys"
ON user_api_keys FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Usuários podem criar suas próprias API keys
CREATE POLICY "Users can insert their own API keys"
ON user_api_keys FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuários podem atualizar suas próprias API keys
CREATE POLICY "Users can update their own API keys"
ON user_api_keys FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Usuários podem deletar suas próprias API keys
CREATE POLICY "Users can delete their own API keys"
ON user_api_keys FOR DELETE
USING (auth.uid() = user_id);

-- Habilitar RLS se não estiver habilitado
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- Verificar policies criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'user_api_keys'
ORDER BY policyname;

-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'user_api_keys';

-- ============================================
-- RESULTADO ESPERADO:
-- 
-- Deve ver 4 policies:
-- 1. Users can view their own API keys (SELECT)
-- 2. Users can insert their own API keys (INSERT)
-- 3. Users can update their own API keys (UPDATE)
-- 4. Users can delete their own API keys (DELETE)
--
-- rowsecurity: true
-- ============================================


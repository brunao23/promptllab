-- =====================================================
-- CORREÇÃO DEFINITIVA: Política RLS Recursiva em admin_users
-- =====================================================
-- PROBLEMA: As políticas RLS estão causando recursão infinita
-- SOLUÇÃO: Usar funções SECURITY DEFINER com privilégios adequados
-- e remover TODAS as políticas antes de recriar
-- =====================================================

-- PASSO 1: Desabilitar temporariamente RLS para limpar todas as políticas
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- PASSO 2: Remover TODAS as políticas existentes (forçar remoção)
DO $$
DECLARE
    pol_name TEXT;
BEGIN
    -- Listar e remover todas as políticas
    FOR pol_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'admin_users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.admin_users', pol_name);
        RAISE NOTICE '✅ Política removida: %', pol_name;
    END LOOP;
END $$;

-- PASSO 3: Remover políticas específicas (caso ainda existam)
DROP POLICY IF EXISTS "Admins podem ver outros admins" ON public.admin_users;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio registro admin" ON public.admin_users;
DROP POLICY IF EXISTS "Apenas admins podem inserir novos admins" ON public.admin_users;
DROP POLICY IF EXISTS "Apenas super admins podem atualizar admins" ON public.admin_users;
DROP POLICY IF EXISTS "Apenas super admins podem deletar admins" ON public.admin_users;

-- PASSO 4: Recriar funções com privilégios adequados (contornam RLS)
CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Esta função executa como o criador (superuser ou role com privilégios)
  -- e pode ler admin_users sem passar por RLS
  RETURN EXISTS (
    SELECT 1 
    FROM public.admin_users
    WHERE user_id = check_user_id
      AND is_active = true
  );
END;
$$;

-- Garantir que a função é acessível
GRANT EXECUTE ON FUNCTION public.is_user_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_admin(UUID) TO anon;

-- PASSO 5: Função para verificar super_admin
CREATE OR REPLACE FUNCTION public.is_user_super_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.admin_users
    WHERE user_id = check_user_id
      AND role = 'super_admin'
      AND is_active = true
  );
END;
$$;

-- Garantir que a função é acessível
GRANT EXECUTE ON FUNCTION public.is_user_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_super_admin(UUID) TO anon;

-- PASSO 6: Reabilitar RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- PASSO 7: Criar políticas que NÃO causam recursão

-- Política 1: Usuários podem ver seu próprio registro (sem recursão - usa comparação direta)
CREATE POLICY "Usuários podem ver seu próprio registro admin"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() -- Comparação direta, sem SELECT na tabela
  );

-- Política 2: Admins podem ver outros admins (usa função que contorna RLS)
CREATE POLICY "Admins podem ver outros admins"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (
    -- Usar função que contorna RLS
    public.is_user_admin(auth.uid()) = true
  );

-- Política 3: INSERT (apenas admins)
CREATE POLICY "Apenas admins podem inserir novos admins"
  ON public.admin_users FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_user_admin(auth.uid()) = true
  );

-- Política 4: UPDATE (apenas super admins)
CREATE POLICY "Apenas super admins podem atualizar admins"
  ON public.admin_users FOR UPDATE
  TO authenticated
  USING (
    public.is_user_super_admin(auth.uid()) = true
  )
  WITH CHECK (
    public.is_user_super_admin(auth.uid()) = true
  );

-- Política 5: DELETE (apenas super admins, não pode deletar a si mesmo)
CREATE POLICY "Apenas super admins podem deletar admins"
  ON public.admin_users FOR DELETE
  TO authenticated
  USING (
    public.is_user_super_admin(auth.uid()) = true
    AND user_id != auth.uid()
  );

-- PASSO 8: Verificar resultado
DO $$
DECLARE
    pol_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO pol_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'admin_users';
    
    RAISE NOTICE '✅ Políticas RLS corrigidas para admin_users';
    RAISE NOTICE '✅ Total de políticas criadas: %', pol_count;
    RAISE NOTICE '✅ Funções is_user_admin e is_user_super_admin criadas';
    RAISE NOTICE '✅ Recursão infinita resolvida!';
END $$;


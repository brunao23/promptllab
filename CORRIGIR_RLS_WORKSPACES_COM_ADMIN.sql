-- =====================================================
-- CORREÇÃO DEFINITIVA: Políticas RLS para Workspaces COM SUPORTE A ADMINS
-- Resolve o problema de Admin Master não ver todos os dados
-- =====================================================

-- PASSO 1: Criar ou substituir função is_user_admin
-- (Se já existe, será substituída. Se não existe, será criada)
CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id UUID)
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
      AND is_active = true
  );
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.is_user_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_admin(UUID) TO anon;

-- PASSO 2: Remover TODAS as políticas existentes de workspaces
DROP POLICY IF EXISTS "Users can view their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can update their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can delete their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Admins can view all workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Admins can manage all workspaces" ON public.workspaces;

-- PASSO 3: Criar políticas RLS com suporte a ADMINS

-- Política SELECT: Usuários podem ver seus próprios workspaces OU admins podem ver TODOS
CREATE POLICY "Users can view their own workspaces"
    ON public.workspaces
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id 
        OR public.is_user_admin(auth.uid()) = true
    );

-- Política INSERT: Usuários podem criar seus próprios workspaces OU admins podem criar para qualquer usuário
CREATE POLICY "Users can create their own workspaces"
    ON public.workspaces
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id 
        OR public.is_user_admin(auth.uid()) = true
    );

-- Política UPDATE: Usuários podem atualizar seus próprios workspaces OU admins podem atualizar qualquer workspace
CREATE POLICY "Users can update their own workspaces"
    ON public.workspaces
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = user_id 
        OR public.is_user_admin(auth.uid()) = true
    )
    WITH CHECK (
        auth.uid() = user_id 
        OR public.is_user_admin(auth.uid()) = true
    );

-- Política DELETE: Usuários podem deletar seus próprios workspaces OU admins podem deletar qualquer workspace
CREATE POLICY "Users can delete their own workspaces"
    ON public.workspaces
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = user_id 
        OR public.is_user_admin(auth.uid()) = true
    );

-- PASSO 4: Garantir que RLS está habilitado
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- PASSO 5: Verificar se as políticas foram criadas
DO $$
DECLARE
    pol_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO pol_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'workspaces';
    
    RAISE NOTICE '✅ Políticas RLS criadas para workspaces COM SUPORTE A ADMINS';
    RAISE NOTICE '✅ Total de políticas: %', pol_count;
    
    IF pol_count < 4 THEN
        RAISE WARNING '⚠️ Esperado 4 políticas, mas encontrado apenas %', pol_count;
    END IF;
END $$;

-- PASSO 6: Verificar se há admins no sistema
DO $$
DECLARE
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count
    FROM public.admin_users
    WHERE is_active = true;
    
    RAISE NOTICE '✅ Total de admins ativos no sistema: %', admin_count;
    
    IF admin_count = 0 THEN
        RAISE WARNING '⚠️ Nenhum admin ativo encontrado! Verifique a tabela admin_users.';
    END IF;
END $$;

-- Mensagem final
SELECT '✅ Script executado com sucesso! Admins agora têm acesso completo aos workspaces.' AS status;


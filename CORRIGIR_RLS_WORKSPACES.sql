-- =====================================================
-- CORREÇÃO: Políticas RLS para Workspaces
-- Garantir que usuários autenticados (incluindo admins) possam acessar workspaces
-- =====================================================

-- PASSO 1: Criar ou substituir função is_user_admin (necessária para políticas de admin)
-- Nota: Se a função já existe, será substituída
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

-- PASSO 2: Remover políticas existentes de workspaces
DROP POLICY IF EXISTS "Users can view their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can update their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can delete their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Admins can view all workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Admins can manage all workspaces" ON public.workspaces;

-- PASSO 3: Recriar políticas RLS para workspaces

-- Política 1: SELECT - Usuários podem ver seus próprios workspaces OU admins podem ver todos
CREATE POLICY "Users can view their own workspaces"
    ON public.workspaces
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id 
        OR public.is_user_admin(auth.uid()) = true
    );

-- Política 2: INSERT - Usuários podem criar seus próprios workspaces OU admins podem criar para qualquer usuário
CREATE POLICY "Users can create their own workspaces"
    ON public.workspaces
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id 
        OR public.is_user_admin(auth.uid()) = true
    );

-- Política 3: UPDATE - Usuários podem atualizar seus próprios workspaces OU admins podem atualizar qualquer workspace
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

-- Política 4: DELETE - Usuários podem deletar seus próprios workspaces OU admins podem deletar qualquer workspace
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

-- PASSO 5: Verificar resultado
DO $$
DECLARE
    pol_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO pol_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'workspaces';
    
    RAISE NOTICE '✅ Políticas RLS corrigidas para workspaces';
    RAISE NOTICE '✅ Total de políticas criadas: %', pol_count;
    RAISE NOTICE '✅ Admins agora têm acesso completo aos workspaces';
END $$;


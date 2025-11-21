-- =====================================================
-- CORREÇÃO DEFINITIVA: Políticas RLS para Workspaces
-- Resolve o erro 42501 "new row violates row-level security policy"
-- =====================================================

-- PASSO 1: Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Users can view their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can update their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can delete their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Admins can view all workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Admins can manage all workspaces" ON public.workspaces;

-- PASSO 2: Verificar se auth.uid() está funcionando
-- (Isso ajuda a debugar se o problema é com auth.uid())
DO $$
BEGIN
    RAISE NOTICE 'Verificando auth.uid(): %', auth.uid();
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'auth.uid() não disponível neste contexto (normal em scripts SQL)';
END $$;

-- PASSO 3: Criar políticas RLS mais robustas
-- IMPORTANTE: Usar COALESCE para lidar com valores NULL

-- Política SELECT: Usuários podem ver seus próprios workspaces
CREATE POLICY "Users can view their own workspaces"
    ON public.workspaces
    FOR SELECT
    TO authenticated
    USING (
        COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid) = user_id
    );

-- Política INSERT: Usuários podem criar seus próprios workspaces
-- CRÍTICO: A política WITH CHECK deve permitir a inserção se auth.uid() = user_id
CREATE POLICY "Users can create their own workspaces"
    ON public.workspaces
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND user_id IS NOT NULL
        AND auth.uid() = user_id
    );

-- Política UPDATE: Usuários podem atualizar seus próprios workspaces
CREATE POLICY "Users can update their own workspaces"
    ON public.workspaces
    FOR UPDATE
    TO authenticated
    USING (
        COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid) = user_id
    )
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND user_id IS NOT NULL
        AND auth.uid() = user_id
    );

-- Política DELETE: Usuários podem deletar seus próprios workspaces
CREATE POLICY "Users can delete their own workspaces"
    ON public.workspaces
    FOR DELETE
    TO authenticated
    USING (
        COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid) = user_id
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
    
    RAISE NOTICE '✅ Políticas RLS criadas para workspaces';
    RAISE NOTICE '✅ Total de políticas: %', pol_count;
    
    IF pol_count < 4 THEN
        RAISE WARNING '⚠️ Esperado 4 políticas, mas encontrado apenas %', pol_count;
    END IF;
END $$;

-- PASSO 6: Verificar estrutura da tabela (para debug)
DO $$
DECLARE
    col_info RECORD;
BEGIN
    RAISE NOTICE 'Estrutura da tabela workspaces:';
    FOR col_info IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'workspaces'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %: % (nullable: %)', col_info.column_name, col_info.data_type, col_info.is_nullable;
    END LOOP;
END $$;

-- Mensagem final
SELECT '✅ Script executado com sucesso! Verifique os NOTICES acima para detalhes.' AS status;


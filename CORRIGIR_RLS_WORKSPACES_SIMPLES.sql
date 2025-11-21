-- =====================================================
-- CORREÇÃO SIMPLES: Políticas RLS para Workspaces
-- Versão simplificada que garante acesso para usuários autenticados
-- =====================================================

-- PASSO 1: Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Users can view their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can update their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can delete their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Admins can view all workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Admins can manage all workspaces" ON public.workspaces;

-- PASSO 2: Criar políticas simples que permitem acesso para usuários autenticados
-- (Sem verificação de admin por enquanto, para garantir que funcione)

-- Política SELECT: Usuários podem ver seus próprios workspaces
CREATE POLICY "Users can view their own workspaces"
    ON public.workspaces
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Política INSERT: Usuários podem criar seus próprios workspaces
CREATE POLICY "Users can create their own workspaces"
    ON public.workspaces
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Política UPDATE: Usuários podem atualizar seus próprios workspaces
CREATE POLICY "Users can update their own workspaces"
    ON public.workspaces
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política DELETE: Usuários podem deletar seus próprios workspaces
CREATE POLICY "Users can delete their own workspaces"
    ON public.workspaces
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- PASSO 3: Garantir que RLS está habilitado
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Mensagem de sucesso
SELECT '✅ Políticas RLS básicas criadas para workspaces' AS status;


-- =====================================================
-- SCHEMA PARA SISTEMA DE WORKSPACES
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. CRIAR TABELA DE WORKSPACES
-- =====================================================

-- Criar tabela sem constraint primeiro (se não existir)
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar constraint apenas se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'workspaces_user_id_fkey'
    ) THEN
        ALTER TABLE public.workspaces 
        ADD CONSTRAINT workspaces_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON public.workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_user_active ON public.workspaces(user_id, is_active);

-- 2. ADICIONAR CAMPO WORKSPACE_ID NA TABELA PROMPTS
-- =====================================================

-- Verificar se a coluna já existe antes de adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prompts' 
        AND column_name = 'workspace_id'
    ) THEN
        ALTER TABLE public.prompts ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_prompts_workspace_id ON public.prompts(workspace_id);
    END IF;
END $$;

-- 3. FUNÇÃO PARA CRIAR WORKSPACE PADRÃO PARA NOVOS USUÁRIOS
-- =====================================================

CREATE OR REPLACE FUNCTION create_default_workspace()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar workspace padrão "Meu Workspace" para o novo usuário
    INSERT INTO public.workspaces (user_id, name, description, is_active, is_default)
    VALUES (
        NEW.id,
        'Meu Workspace',
        'Workspace padrão',
        true,
        true
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Erro ao criar workspace padrão para usuário %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para criar workspace padrão quando usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created_workspace ON auth.users;
CREATE TRIGGER on_auth_user_created_workspace
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_workspace();

-- 4. POLÍTICAS RLS PARA WORKSPACES
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só podem ver seus próprios workspaces
DROP POLICY IF EXISTS "Users can view their own workspaces" ON public.workspaces;
CREATE POLICY "Users can view their own workspaces"
    ON public.workspaces
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política: Usuários podem criar seus próprios workspaces
DROP POLICY IF EXISTS "Users can create their own workspaces" ON public.workspaces;
CREATE POLICY "Users can create their own workspaces"
    ON public.workspaces
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar seus próprios workspaces
DROP POLICY IF EXISTS "Users can update their own workspaces" ON public.workspaces;
CREATE POLICY "Users can update their own workspaces"
    ON public.workspaces
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem deletar seus próprios workspaces
DROP POLICY IF EXISTS "Users can delete their own workspaces" ON public.workspaces;
CREATE POLICY "Users can delete their own workspaces"
    ON public.workspaces
    FOR DELETE
    USING (auth.uid() = user_id);

-- 5. FUNÇÃO PARA GARANTIR QUE SÓ EXISTA UM WORKSPACE PADRÃO POR USUÁRIO
-- =====================================================

CREATE OR REPLACE FUNCTION ensure_single_default_workspace()
RETURNS TRIGGER AS $$
BEGIN
    -- Se este workspace está sendo marcado como padrão, desmarcar os outros
    IF NEW.is_default = true THEN
        UPDATE public.workspaces
        SET is_default = false
        WHERE user_id = NEW.user_id
        AND id != NEW.id
        AND is_default = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para garantir único workspace padrão
DROP TRIGGER IF EXISTS ensure_single_default_workspace_trigger ON public.workspaces;
CREATE TRIGGER ensure_single_default_workspace_trigger
    BEFORE INSERT OR UPDATE ON public.workspaces
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_workspace();

-- 6. CRIAR WORKSPACES PADRÃO PARA USUÁRIOS EXISTENTES QUE NÃO TÊM
-- =====================================================

INSERT INTO public.workspaces (user_id, name, description, is_active, is_default)
SELECT 
    u.id,
    'Meu Workspace',
    'Workspace padrão',
    true,
    true
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 
    FROM public.workspaces w 
    WHERE w.user_id = u.id
)
ON CONFLICT DO NOTHING;

-- 7. ATUALIZAR PROMPTS EXISTENTES PARA O WORKSPACE PADRÃO
-- =====================================================

-- Atualizar prompts existentes para associar ao workspace padrão do usuário
UPDATE public.prompts p
SET workspace_id = (
    SELECT w.id 
    FROM public.workspaces w 
    INNER JOIN public.profiles pr ON pr.id = p.user_id
    WHERE w.user_id = (
        SELECT u.id FROM auth.users u WHERE u.id = pr.id
    )
    AND w.is_default = true
    LIMIT 1
)
WHERE p.workspace_id IS NULL
AND EXISTS (
    SELECT 1 
    FROM public.workspaces w
    INNER JOIN public.profiles pr ON pr.id = p.user_id
    WHERE w.user_id = (
        SELECT u.id FROM auth.users u WHERE u.id = pr.id
    )
    AND w.is_default = true
);

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Schema de workspaces criado com sucesso!';
    RAISE NOTICE '✅ Tabela workspaces criada';
    RAISE NOTICE '✅ Campo workspace_id adicionado à tabela prompts';
    RAISE NOTICE '✅ Políticas RLS configuradas';
    RAISE NOTICE '✅ Triggers criados';
    RAISE NOTICE '✅ Workspaces padrão criados para usuários existentes';
END $$;


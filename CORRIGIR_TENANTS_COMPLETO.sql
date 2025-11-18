-- =====================================================
-- SCRIPT PARA CORRIGIR E INTEGRAR TENANTS COMPLETAMENTE
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. ADICIONAR CAMPO TENANT_ID NA TABELA PROFILES
-- =====================================================

-- Adicionar tenant_id em profiles se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
        
        RAISE NOTICE 'Campo tenant_id adicionado à tabela profiles';
    ELSE
        RAISE NOTICE 'Campo tenant_id já existe na tabela profiles';
    END IF;
END $$;

-- 2. ADICIONAR CAMPO TENANT_ID NA TABELA PROMPTS (SE NÃO EXISTIR)
-- =====================================================

-- Adicionar tenant_id em prompts se não existir (além de workspace_id)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prompts' 
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.prompts 
        ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_prompts_tenant_id ON public.prompts(tenant_id);
        
        RAISE NOTICE 'Campo tenant_id adicionado à tabela prompts';
    ELSE
        RAISE NOTICE 'Campo tenant_id já existe na tabela prompts';
    END IF;
END $$;

-- 3. ADICIONAR CAMPO TENANT_ID NA TABELA WORKSPACES (SE NÃO EXISTIR)
-- =====================================================

-- Adicionar tenant_id em workspaces se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'workspaces' 
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.workspaces 
        ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_workspaces_tenant_id ON public.workspaces(tenant_id);
        
        RAISE NOTICE 'Campo tenant_id adicionado à tabela workspaces';
    ELSE
        RAISE NOTICE 'Campo tenant_id já existe na tabela workspaces';
    END IF;
END $$;

-- 4. FUNÇÃO PARA ASSOCIAR TENANT AO USUÁRIO BASEADO NA SUBSCRIPTION
-- =====================================================

CREATE OR REPLACE FUNCTION sync_user_tenant_from_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- Se a subscription tem tenant_id, atualizar o profile do usuário
    IF NEW.tenant_id IS NOT NULL THEN
        UPDATE public.profiles
        SET tenant_id = NEW.tenant_id
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para sincronizar tenant_id quando subscription é criada/atualizada
DROP TRIGGER IF EXISTS sync_tenant_on_subscription_change ON public.subscriptions;
CREATE TRIGGER sync_tenant_on_subscription_change
    AFTER INSERT OR UPDATE OF tenant_id ON public.subscriptions
    FOR EACH ROW
    WHEN (NEW.tenant_id IS NOT NULL)
    EXECUTE FUNCTION sync_user_tenant_from_subscription();

-- 5. ATUALIZAR TENANT_ID EXISTENTES BASEADO NAS SUBSCRIPTIONS
-- =====================================================

-- Atualizar profiles com tenant_id da subscription ativa
UPDATE public.profiles p
SET tenant_id = (
    SELECT s.tenant_id
    FROM public.subscriptions s
    WHERE s.user_id = p.id
    AND s.is_active = true
    AND s.tenant_id IS NOT NULL
    LIMIT 1
)
WHERE tenant_id IS NULL
AND EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.user_id = p.id
    AND s.is_active = true
    AND s.tenant_id IS NOT NULL
);

-- 6. ATUALIZAR WORKSPACES COM TENANT_ID DO USUÁRIO
-- =====================================================

-- Atualizar workspaces com tenant_id do usuário dono
UPDATE public.workspaces w
SET tenant_id = (
    SELECT p.tenant_id
    FROM public.profiles p
    WHERE p.id = w.user_id
    AND p.tenant_id IS NOT NULL
    LIMIT 1
)
WHERE tenant_id IS NULL
AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = w.user_id
    AND p.tenant_id IS NOT NULL
);

-- 7. ATUALIZAR PROMPTS COM TENANT_ID DO WORKSPACE
-- =====================================================

-- Atualizar prompts com tenant_id do workspace
UPDATE public.prompts p
SET tenant_id = (
    SELECT w.tenant_id
    FROM public.workspaces w
    WHERE w.id = p.workspace_id
    AND w.tenant_id IS NOT NULL
    LIMIT 1
)
WHERE tenant_id IS NULL
AND p.workspace_id IS NOT NULL
AND EXISTS (
    SELECT 1
    FROM public.workspaces w
    WHERE w.id = p.workspace_id
    AND w.tenant_id IS NOT NULL
);

-- Fallback: se prompt não tem workspace, usar tenant_id do usuário
UPDATE public.prompts p
SET tenant_id = (
    SELECT pr.tenant_id
    FROM public.profiles pr
    WHERE pr.id = p.user_id
    AND pr.tenant_id IS NOT NULL
    LIMIT 1
)
WHERE tenant_id IS NULL
AND EXISTS (
    SELECT 1
    FROM public.profiles pr
    WHERE pr.id = p.user_id
    AND pr.tenant_id IS NOT NULL
);

-- 8. POLÍTICAS RLS PARA ISOLAMENTO DE TENANTS (OPCIONAL - MUITO RESTRITIVO)
-- =====================================================
-- Comentado por padrão - descomente se quiser isolamento total por tenant

/*
-- Política para profiles: usuários só veem profiles do mesmo tenant
DROP POLICY IF EXISTS "Users can only see profiles from their tenant" ON public.profiles;
CREATE POLICY "Users can only see profiles from their tenant"
    ON public.profiles
    FOR SELECT
    USING (
        id = auth.uid() OR -- Pode ver seu próprio profile
        tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    );

-- Política para prompts: usuários só veem prompts do mesmo tenant
DROP POLICY IF EXISTS "Users can only see prompts from their tenant" ON public.prompts;
CREATE POLICY "Users can only see prompts from their tenant"
    ON public.prompts
    FOR SELECT
    USING (
        user_id = (SELECT id FROM public.profiles WHERE id = auth.uid()) OR -- Seu próprio prompt
        tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) -- Mesmo tenant
    );

-- Política para workspaces: usuários só veem workspaces do mesmo tenant
DROP POLICY IF EXISTS "Users can only see workspaces from their tenant" ON public.workspaces;
CREATE POLICY "Users can only see workspaces from their tenant"
    ON public.workspaces
    FOR SELECT
    USING (
        user_id = auth.uid() OR -- Seu próprio workspace
        tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) -- Mesmo tenant
    );
*/

-- 9. FUNÇÃO PARA OBTER TENANT_ID DO USUÁRIO ATUAL
-- =====================================================

CREATE OR REPLACE FUNCTION get_current_user_tenant_id()
RETURNS UUID AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    SELECT tenant_id INTO v_tenant_id
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. MENSAGEM DE SUCESSO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Integração de tenants concluída!';
    RAISE NOTICE '✅ Campos tenant_id adicionados/verificados em:';
    RAISE NOTICE '   - profiles';
    RAISE NOTICE '   - prompts';
    RAISE NOTICE '   - workspaces';
    RAISE NOTICE '✅ Trigger criado para sincronizar tenant_id de subscriptions para profiles';
    RAISE NOTICE '✅ Dados existentes atualizados com tenant_id baseado em subscriptions';
    RAISE NOTICE '';
    RAISE NOTICE '💡 IMPORTANTE:';
    RAISE NOTICE '   - Tenants são associados aos usuários via subscriptions';
    RAISE NOTICE '   - Quando uma subscription tem tenant_id, o profile do usuário é atualizado automaticamente';
    RAISE NOTICE '   - Workspaces e prompts herdam tenant_id do usuário/workspace';
    RAISE NOTICE '   - As políticas RLS de isolamento por tenant estão comentadas (muito restritivas)';
    RAISE NOTICE '   - Descomente as políticas RLS se quiser isolamento total por tenant';
END $$;


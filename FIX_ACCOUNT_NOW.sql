-- ============================================
-- SCRIPT DE CORREÇÃO URGENTE DA CONTA
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. Ver seu usuário atual
SELECT 
    id as user_id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
WHERE email = 'brunocostaads23@gmail.com';

-- 2. Ver se o profile existe
SELECT 
    id,
    email,
    full_name,
    created_at
FROM profiles
WHERE email = 'brunocostaads23@gmail.com';

-- 3. CRIAR/CORRIGIR o profile (rode isso se o profile não existir ou estiver errado)
INSERT INTO profiles (id, email, full_name)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', 'Admin Master') as full_name
FROM auth.users
WHERE email = 'brunocostaads23@gmail.com'
ON CONFLICT (id) 
DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name, 'Admin Master'),
    updated_at = now();

-- 4. Verificar/criar admin_users
INSERT INTO admin_users (user_id, email, role, is_active, can_manage_tenants, can_manage_subscriptions, can_view_analytics)
SELECT 
    id,
    email,
    'super_admin',
    true,
    true,
    true,
    true
FROM auth.users
WHERE email = 'brunocostaads23@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET
    role = 'super_admin',
    is_active = true,
    can_manage_tenants = true,
    can_manage_subscriptions = true,
    can_view_analytics = true,
    updated_at = now();

-- 5. Ver workspaces (DEVE usar auth.users.id)
SELECT 
    id,
    user_id,
    name,
    is_default,
    is_active
FROM workspaces
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'brunocostaads23@gmail.com'
);

-- 6. CRIAR workspace padrão se não existir
DO $$
DECLARE
    v_user_id uuid;
    v_workspace_exists boolean;
BEGIN
    -- Pegar o user_id
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'brunocostaads23@gmail.com';
    
    -- Verificar se já existe workspace padrão
    SELECT EXISTS(
        SELECT 1 FROM workspaces 
        WHERE user_id = v_user_id 
        AND is_default = true 
        AND is_active = true
    ) INTO v_workspace_exists;
    
    -- Criar se não existir
    IF NOT v_workspace_exists THEN
        INSERT INTO workspaces (user_id, name, description, is_default, is_active)
        VALUES (
            v_user_id,
            'Meu Workspace',
            'Workspace padrão',
            true,
            true
        );
        RAISE NOTICE 'Workspace padrão criado!';
    ELSE
        RAISE NOTICE 'Workspace padrão já existe';
    END IF;
END $$;

-- 7. Ver prompts (DEVE usar profiles.id)
SELECT 
    p.id,
    p.user_id,
    p.title,
    p.workspace_id,
    p.is_active,
    p.created_at
FROM prompts p
WHERE p.user_id IN (
    SELECT id FROM profiles WHERE email = 'brunocostaads23@gmail.com'
)
ORDER BY p.created_at DESC
LIMIT 5;

-- 8. CORRIGIR POLÍTICAS RLS para workspaces (se necessário)
DROP POLICY IF EXISTS "Users can view their own workspaces" ON workspaces;
CREATE POLICY "Users can view their own workspaces"
ON workspaces FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own workspaces" ON workspaces;
CREATE POLICY "Users can insert their own workspaces"
ON workspaces FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own workspaces" ON workspaces;
CREATE POLICY "Users can update their own workspaces"
ON workspaces FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own workspaces" ON workspaces;
CREATE POLICY "Users can delete their own workspaces"
ON workspaces FOR DELETE
USING (auth.uid() = user_id);

-- 9. CORRIGIR POLÍTICAS RLS para prompts
DROP POLICY IF EXISTS "Users can view their own prompts" ON prompts;
CREATE POLICY "Users can view their own prompts"
ON prompts FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own prompts" ON prompts;
CREATE POLICY "Users can insert their own prompts"
ON prompts FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own prompts" ON prompts;
CREATE POLICY "Users can update their own prompts"
ON prompts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own prompts" ON prompts;
CREATE POLICY "Users can delete their own prompts"
ON prompts FOR DELETE
USING (auth.uid() = user_id);

-- 10. Verificação final
SELECT 
    'AUTH USER' as type,
    au.id,
    au.email,
    au.email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users au
WHERE au.email = 'brunocostaads23@gmail.com'

UNION ALL

SELECT 
    'PROFILE' as type,
    p.id,
    p.email,
    p.full_name IS NOT NULL as has_name
FROM profiles p
WHERE p.email = 'brunocostaads23@gmail.com'

UNION ALL

SELECT 
    'ADMIN' as type,
    ad.user_id as id,
    ad.email,
    ad.is_active
FROM admin_users ad
WHERE ad.email = 'brunocostaads23@gmail.com'

UNION ALL

SELECT 
    'WORKSPACE' as type,
    w.id,
    w.name as email,
    w.is_default
FROM workspaces w
WHERE w.user_id IN (SELECT id FROM auth.users WHERE email = 'brunocostaads23@gmail.com')
LIMIT 1;

-- ============================================
-- RESULTADO ESPERADO:
-- Você deve ver 4 linhas:
-- - AUTH USER (seu usuário)
-- - PROFILE (seu perfil)
-- - ADMIN (seu admin)
-- - WORKSPACE (seu workspace)
-- ============================================


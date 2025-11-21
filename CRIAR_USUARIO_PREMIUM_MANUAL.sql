-- ============================================
-- CRIAR USUÁRIO PREMIUM MANUALMENTE
-- Execute no Supabase SQL Editor
-- ============================================

-- PREENCHA ESTAS VARIÁVEIS:
-- Substitua 'email@exemplo.com' pelo email do novo usuário
-- Substitua 'senha123' pela senha desejada
-- Substitua 'Nome Completo' pelo nome do usuário

DO $$
DECLARE
    v_email text := 'email@exemplo.com';  -- ⬅️ ALTERE AQUI
    v_nome text := 'Nome Completo';       -- ⬅️ ALTERE AQUI
    v_user_id uuid;
    v_premium_plan_id uuid;
BEGIN
    -- IMPORTANTE: O Supabase não permite criar usuários via SQL
    -- Você precisa criar o usuário PRIMEIRO via Dashboard do Supabase:
    -- 1. Vá em Authentication → Users
    -- 2. Clique em "Add User"
    -- 3. Preencha email e senha
    -- 4. Clique em "Create User"
    -- 5. DEPOIS execute este script para dar premium
    
    -- Pegar o user_id do usuário recém-criado
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário % não encontrado! Crie o usuário primeiro no Dashboard do Supabase (Authentication → Users → Add User)', v_email;
    END IF;
    
    RAISE NOTICE 'Usuário encontrado: %', v_user_id;
    
    -- Criar/atualizar profile
    INSERT INTO profiles (id, email, full_name)
    VALUES (v_user_id, v_email, v_nome)
    ON CONFLICT (id) DO UPDATE
    SET full_name = v_nome,
        updated_at = now();
    
    RAISE NOTICE 'Profile criado/atualizado';
    
    -- Pegar plano Premium
    SELECT id INTO v_premium_plan_id
    FROM plans
    WHERE name = 'premium';
    
    IF v_premium_plan_id IS NULL THEN
        -- Criar plano premium se não existir
        INSERT INTO plans (
            name,
            display_name,
            description,
            max_versions,
            max_tokens_per_month,
            max_prompt_versions,
            can_share_chat,
            price_monthly,
            is_active
        )
        VALUES (
            'premium',
            'Premium',
            'Plano Premium com recursos ilimitados',
            999999,
            999999999,
            999999,
            true,
            29.90,
            true
        )
        RETURNING id INTO v_premium_plan_id;
        
        RAISE NOTICE 'Plano Premium criado';
    END IF;
    
    -- Desativar outras subscriptions do usuário
    UPDATE subscriptions
    SET is_active = false
    WHERE user_id = v_user_id;
    
    -- Criar subscription premium
    INSERT INTO subscriptions (
        user_id,
        plan_id,
        status,
        is_active,
        subscription_started_at,
        current_period_start,
        current_period_end
    )
    VALUES (
        v_user_id,
        v_premium_plan_id,
        'active',
        true,
        now(),
        now(),
        now() + interval '1 year'
    )
    ON CONFLICT (user_id) DO UPDATE
    SET plan_id = v_premium_plan_id,
        status = 'active',
        is_active = true,
        subscription_started_at = now(),
        current_period_start = now(),
        current_period_end = now() + interval '1 year',
        updated_at = now();
    
    RAISE NOTICE '✅ USUÁRIO CRIADO COM PREMIUM!';
    RAISE NOTICE 'Email: %', v_email;
    RAISE NOTICE 'Nome: %', v_nome;
END $$;

-- Verificar resultado
SELECT 
    u.email,
    p.full_name,
    s.status,
    pl.display_name as plano
FROM auth.users u
JOIN profiles p ON u.id = p.id
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.is_active = true
LEFT JOIN plans pl ON s.plan_id = pl.id
WHERE u.email = 'email@exemplo.com';  -- ⬅️ ALTERE AQUI TAMBÉM

-- ============================================
-- INSTRUÇÕES:
-- 
-- 1. PRIMEIRO: Crie o usuário no Dashboard Supabase
--    - Authentication → Users → Add User
--    - Preencha email e senha
--    - Clique "Create User"
--
-- 2. DEPOIS: Execute este script
--    - Altere v_email e v_nome no topo
--    - Altere também no SELECT final
--    - Clique RUN
--
-- 3. PRONTO! O usuário terá Premium ativo
-- ============================================


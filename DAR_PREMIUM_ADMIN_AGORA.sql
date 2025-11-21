-- ============================================
-- DAR PREMIUM ILIMITADO PARA ADMIN MASTER
-- Execute ESTE script no Supabase SQL Editor
-- ============================================

-- 1. Ver seu status atual
SELECT 
    u.email,
    s.status as subscription_status,
    p.name as plan_name,
    s.is_active,
    s.trial_ends_at,
    s.subscription_ends_at
FROM auth.users u
LEFT JOIN subscriptions s ON u.id = s.user_id
LEFT JOIN plans p ON s.plan_id = p.id
WHERE u.email = 'brunocostaads23@gmail.com';

-- 2. DESATIVAR qualquer subscription existente (trial)
UPDATE subscriptions
SET is_active = false
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'brunocostaads23@gmail.com'
);

-- 3. CRIAR/ATIVAR PREMIUM PERMANENTE
DO $$
DECLARE
    v_user_id uuid;
    v_premium_plan_id uuid;
BEGIN
    -- Pegar o user_id
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'brunocostaads23@gmail.com';
    
    -- Pegar o plano Premium
    SELECT id INTO v_premium_plan_id
    FROM plans
    WHERE name = 'premium';
    
    -- Se não existir plano premium, criar
    IF v_premium_plan_id IS NULL THEN
        INSERT INTO plans (
            name, 
            display_name, 
            description, 
            max_versions, 
            max_tokens_per_month, 
            can_share_chat, 
            price_monthly,
            is_active,
            max_prompt_versions
        )
        VALUES (
            'premium',
            'Premium Master',
            'Plano Premium Ilimitado para Admin Master',
            9999,  -- Versões "ilimitadas"
            999999999,  -- Tokens "ilimitados"
            true,
            0.00,  -- Grátis
            true,
            9999  -- Versões do prompt ilimitadas
        )
        RETURNING id INTO v_premium_plan_id;
        
        RAISE NOTICE 'Plano Premium criado!';
    END IF;
    
    -- Inserir subscription PREMIUM ATIVA
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
        'active',  -- ATIVO, NÃO TRIAL!
        true,
        now(),
        now(),
        now() + interval '100 years'  -- 100 anos = permanente
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        plan_id = v_premium_plan_id,
        status = 'active',
        is_active = true,
        subscription_started_at = now(),
        trial_started_at = NULL,
        trial_ends_at = NULL,
        current_period_start = now(),
        current_period_end = now() + interval '100 years',
        updated_at = now();
    
    RAISE NOTICE 'Premium PERMANENTE ativado para admin master!';
END $$;

-- 4. Verificar resultado final
SELECT 
    '🎉 ADMIN MASTER - PREMIUM ATIVO' as status,
    u.email,
    s.status as subscription_status,
    p.name as plan_name,
    p.display_name,
    p.max_versions,
    p.max_tokens_per_month,
    s.is_active,
    s.subscription_started_at,
    s.current_period_end
FROM auth.users u
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.is_active = true
LEFT JOIN plans p ON s.plan_id = p.id
WHERE u.email = 'brunocostaads23@gmail.com';

-- 5. GARANTIR que o plano premium tem limites altos
UPDATE plans
SET 
    max_versions = 9999,
    max_tokens_per_month = 999999999,
    max_prompt_versions = 9999,
    can_share_chat = true,
    is_active = true
WHERE name = 'premium';

-- ============================================
-- RESULTADO ESPERADO:
-- Você deve ver:
-- - subscription_status: active
-- - plan_name: premium
-- - max_versions: 9999
-- - max_tokens_per_month: 999999999
-- ============================================


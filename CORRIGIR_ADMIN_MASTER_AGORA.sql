-- ============================================
-- TRANSFORMAR brunocostaads23@gmail.com EM ADMIN MASTER COM PREMIUM ILIMITADO
-- EXECUTE ESTE SCRIPT NO SUPABASE SQL EDITOR AGORA!
-- ============================================

-- PASSO 1: Ver status atual
SELECT 
    '=== STATUS ATUAL ===' as info,
    u.id as user_id,
    u.email,
    p.full_name,
    ad.role as admin_role,
    s.status as subscription_status,
    pl.display_name as plan_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN admin_users ad ON u.id = ad.user_id
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.is_active = true
LEFT JOIN plans pl ON s.plan_id = pl.id
WHERE u.email = 'brunocostaads23@gmail.com';

-- PASSO 2: GARANTIR que o profile existe
INSERT INTO profiles (id, email, full_name)
SELECT 
    id,
    email,
    'Bruno Ricardo Costa Peclat'
FROM auth.users
WHERE email = 'brunocostaads23@gmail.com'
ON CONFLICT (id) 
DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();

-- PASSO 3: GARANTIR que é super_admin
DELETE FROM admin_users WHERE email = 'brunocostaads23@gmail.com';

INSERT INTO admin_users (user_id, email, role, is_active, can_manage_tenants, can_manage_subscriptions, can_view_analytics)
SELECT 
    id,
    'brunocostaads23@gmail.com',
    'super_admin',
    true,
    true,
    true,
    true
FROM auth.users
WHERE email = 'brunocostaads23@gmail.com';

-- PASSO 4: CRIAR/GARANTIR plano Premium Ilimitado
INSERT INTO plans (
    name,
    display_name,
    description,
    max_versions,
    max_tokens_per_month,
    max_prompt_versions,
    can_share_chat,
    trial_days,
    price_monthly,
    price_yearly,
    is_active
)
VALUES (
    'admin_premium',
    '🔐 Admin Premium Master',
    'Plano ilimitado exclusivo para administradores',
    999999,
    999999999,
    999999,
    true,
    NULL,
    0.00,
    0.00,
    true
)
ON CONFLICT (name) DO UPDATE SET
    display_name = '🔐 Admin Premium Master',
    max_versions = 999999,
    max_tokens_per_month = 999999999,
    max_prompt_versions = 999999,
    can_share_chat = true,
    is_active = true,
    updated_at = now();

-- PASSO 5: DESATIVAR qualquer subscription trial antiga
UPDATE subscriptions
SET is_active = false
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'brunocostaads23@gmail.com'
);

-- PASSO 6: CRIAR SUBSCRIPTION PREMIUM ILIMITADA
INSERT INTO subscriptions (
    user_id,
    plan_id,
    status,
    is_active,
    subscription_started_at,
    current_period_start,
    current_period_end,
    trial_started_at,
    trial_ends_at
)
SELECT 
    u.id,
    p.id,
    'active',  -- NÃO É TRIAL!
    true,
    now(),
    now(),
    now() + interval '100 years',
    NULL,  -- SEM TRIAL
    NULL   -- SEM TRIAL
FROM auth.users u
CROSS JOIN plans p
WHERE u.email = 'brunocostaads23@gmail.com'
AND p.name = 'admin_premium'
ON CONFLICT (user_id) 
DO UPDATE SET
    plan_id = (SELECT id FROM plans WHERE name = 'admin_premium'),
    status = 'active',
    is_active = true,
    subscription_started_at = now(),
    trial_started_at = NULL,
    trial_ends_at = NULL,
    current_period_start = now(),
    current_period_end = now() + interval '100 years',
    updated_at = now();

-- PASSO 7: VERIFICAR RESULTADO FINAL
SELECT 
    '🎉 === ADMIN MASTER ATIVADO COM SUCESSO === 🎉' as status,
    u.email,
    p.full_name,
    ad.role as admin_role,
    ad.is_active as admin_active,
    s.status as subscription_status,
    pl.display_name as plan_name,
    pl.max_prompt_versions as versoes_permitidas,
    pl.max_tokens_per_month as tokens_permitidos,
    pl.can_share_chat as pode_compartilhar,
    s.current_period_end as validade_ate
FROM auth.users u
JOIN profiles p ON u.id = p.id
JOIN admin_users ad ON u.id = ad.user_id
JOIN subscriptions s ON u.id = s.user_id AND s.is_active = true
JOIN plans pl ON s.plan_id = pl.id
WHERE u.email = 'brunocostaads23@gmail.com';

-- ============================================
-- RESULTADO ESPERADO:
-- 
-- admin_role: super_admin
-- subscription_status: active (NÃO trial!)
-- plan_name: 🔐 Admin Premium Master
-- versoes_permitidas: 999999
-- tokens_permitidos: 999999999
-- pode_compartilhar: true
-- ============================================

-- Se você ver esses valores, ESTÁ CORRETO!
-- Agora clique no botão 💣 (laranja) no site e faça login novamente


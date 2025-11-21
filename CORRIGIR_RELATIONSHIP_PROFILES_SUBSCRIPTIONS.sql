-- ============================================
-- CORRIGIR ERRO: Could not find a relationship between 'profiles' and 'subscriptions'
-- Execute no Supabase SQL Editor
-- ============================================

-- PROBLEMA: A query tenta fazer JOIN entre profiles e subscriptions
-- mas não há foreign key direta entre elas.

-- SOLUÇÃO: Ambas as tabelas têm user_id que referencia auth.users

-- Ver estrutura atual das foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('profiles', 'subscriptions')
ORDER BY tc.table_name, kcu.column_name;

-- Ver dados atuais
SELECT 
    p.id as profile_id,
    p.email as profile_email,
    s.id as subscription_id,
    s.user_id as subscription_user_id,
    s.status
FROM profiles p
LEFT JOIN subscriptions s ON p.id = s.user_id
WHERE p.email = 'brunocostaads23@gmail.com';

-- VERIFICAÇÃO: profiles.id deve ser igual a subscriptions.user_id
-- Se não aparecer a subscription, execute CORRIGIR_ADMIN_MASTER_AGORA.sql

-- ============================================
-- NOTA IMPORTANTE:
-- 
-- O schema atual é:
-- - profiles.id → auth.users.id (FK)
-- - subscriptions.user_id → auth.users.id (FK)
--
-- Portanto, o JOIN correto é:
-- profiles.id = subscriptions.user_id
--
-- O código já está fazendo isso corretamente.
-- Se o erro persiste, pode ser cache do Supabase.
-- ============================================

-- Forçar refresh do schema cache
NOTIFY pgrst, 'reload schema';

-- Se o erro persistir, tente isto:
-- 1. Vá no Dashboard Supabase
-- 2. Settings → API
-- 3. Clique em "Restart API Server"
-- 4. Aguarde 1 minuto
-- 5. Tente novamente

-- Verificação final: Ver se a subscription existe
SELECT 
    'VERIFICAÇÃO FINAL' as info,
    u.email,
    p.id as profile_id,
    s.id as subscription_id,
    s.status,
    pl.display_name as plano
FROM auth.users u
JOIN profiles p ON u.id = p.id
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.is_active = true
LEFT JOIN plans pl ON s.plan_id = pl.id
WHERE u.email = 'brunocostaads23@gmail.com';

-- Se a subscription aparecer aqui mas não no código, o problema é cache.
-- Solução: Aguarde 1-2 minutos ou restart API do Supabase.


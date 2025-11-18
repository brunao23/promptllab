-- =====================================================
-- SCRIPT DE VERIFICAÇÃO E CRIAÇÃO DE SUBSCRIPTIONS
-- Execute este script no Supabase SQL Editor para:
-- 1. Verificar se as subscriptions existem
-- 2. Criar subscriptions para usuários que não têm
-- 3. Verificar se o trigger está funcionando
-- =====================================================

-- 1. Verificar se o trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 2. Verificar usuários sem subscription
SELECT 
  u.id as user_id,
  u.email,
  COUNT(s.id) as subscription_count
FROM auth.users u
LEFT JOIN public.subscriptions s ON s.user_id = u.id
GROUP BY u.id, u.email
HAVING COUNT(s.id) = 0;

-- 3. Verificar se a foreign key está correta
-- Primeiro, vamos verificar a constraint atual
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'subscriptions_user_id_fkey';

-- 4. Se a foreign key estiver errada, vamos corrigi-la
-- Remover constraint antiga se existir
ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;

-- Criar constraint correta apontando para auth.users
ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Criar subscriptions para usuários que não têm
-- Para usuários normais
INSERT INTO public.subscriptions (user_id, plan_id, trial_started_at, trial_ends_at, status, is_active)
SELECT 
  u.id,
  '00000000-0000-0000-0000-000000000001', -- trial
  NOW(),
  NOW() + INTERVAL '7 days',
  'trial',
  true
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions s WHERE s.user_id = u.id
)
AND u.email != 'brunocostaads23@gmail.com'
ON CONFLICT DO NOTHING;

-- Para o admin master
INSERT INTO public.subscriptions (user_id, plan_id, trial_started_at, trial_ends_at, status, is_active)
SELECT 
  u.id,
  '00000000-0000-0000-0000-000000000002', -- premium
  NOW(),
  NOW() + INTERVAL '1 year',
  'active',
  true
FROM auth.users u
WHERE u.email = 'brunocostaads23@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.subscriptions s WHERE s.user_id = u.id
)
ON CONFLICT DO NOTHING;

-- 4. Verificar todas as subscriptions criadas
SELECT 
  s.id,
  s.user_id,
  u.email,
  s.status,
  s.trial_ends_at,
  p.display_name as plan_name,
  s.is_active
FROM public.subscriptions s
JOIN auth.users u ON u.id = s.user_id
LEFT JOIN public.plans p ON p.id = s.plan_id
ORDER BY s.created_at DESC;


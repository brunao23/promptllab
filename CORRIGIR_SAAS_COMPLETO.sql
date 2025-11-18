-- =====================================================
-- SCRIPT COMPLETO PARA CORRIGIR E CONFIGURAR O SAAS
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. VERIFICAR E CRIAR TRIGGER PARA CRIAR SUBSCRIPTIONS AUTOMATICAMENTE
-- =====================================================

-- Função para criar subscription quando um usuário é criado
CREATE OR REPLACE FUNCTION create_master_admin()
RETURNS TRIGGER AS $$
DECLARE
  v_trial_plan_id UUID := '00000000-0000-0000-0000-000000000001';
  v_premium_plan_id UUID := '00000000-0000-0000-0000-000000000002';
  v_user_email TEXT;
BEGIN
  -- Obter email do usuário
  v_user_email := NEW.email;
  
  -- Se for o admin master, criar subscription premium
  IF v_user_email = 'brunocostaads23@gmail.com' THEN
    INSERT INTO public.subscriptions (
      user_id,
      plan_id,
      trial_started_at,
      trial_ends_at,
      subscription_started_at,
      subscription_ends_at,
      status,
      is_active
    ) VALUES (
      NEW.id,
      v_premium_plan_id,
      NOW(),
      NOW() + INTERVAL '1 year',
      NOW(),
      NOW() + INTERVAL '1 year',
      'active',
      true
    )
    ON CONFLICT (user_id, plan_id) DO NOTHING;
    
    RAISE NOTICE 'Subscription premium criada para admin master: %', v_user_email;
  ELSE
    -- Para usuários normais, criar subscription trial
    INSERT INTO public.subscriptions (
      user_id,
      plan_id,
      trial_started_at,
      trial_ends_at,
      status,
      is_active
    ) VALUES (
      NEW.id,
      v_trial_plan_id,
      NOW(),
      NOW() + INTERVAL '7 days',
      'trial',
      true
    )
    ON CONFLICT (user_id, plan_id) DO NOTHING;
    
    RAISE NOTICE 'Subscription trial criada para usuário: %', v_user_email;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar subscription para usuário %: %', v_user_email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_master_admin();

-- 2. GARANTIR QUE A FOREIGN KEY ESTÁ CORRETA
-- =====================================================

-- Remover constraint antiga se existir
ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;

-- Criar constraint correta apontando para auth.users
ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. CRIAR SUBSCRIPTIONS PARA USUÁRIOS QUE JÁ EXISTEM MAS NÃO TÊM SUBSCRIPTION
-- =====================================================

-- Para usuários normais (trial)
INSERT INTO public.subscriptions (
  user_id,
  plan_id,
  trial_started_at,
  trial_ends_at,
  status,
  is_active
)
SELECT 
  u.id,
  '00000000-0000-0000-0000-000000000001', -- trial plan
  NOW(),
  NOW() + INTERVAL '7 days',
  'trial',
  true
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.subscriptions s 
  WHERE s.user_id = u.id AND s.is_active = true
)
AND u.email != 'brunocostaads23@gmail.com'
ON CONFLICT DO NOTHING;

-- Para o admin master (premium)
INSERT INTO public.subscriptions (
  user_id,
  plan_id,
  trial_started_at,
  trial_ends_at,
  subscription_started_at,
  subscription_ends_at,
  status,
  is_active
)
SELECT 
  u.id,
  '00000000-0000-0000-0000-000000000002', -- premium plan
  NOW(),
  NOW() + INTERVAL '1 year',
  NOW(),
  NOW() + INTERVAL '1 year',
  'active',
  true
FROM auth.users u
WHERE u.email = 'brunocostaads23@gmail.com'
AND NOT EXISTS (
  SELECT 1 
  FROM public.subscriptions s 
  WHERE s.user_id = u.id AND s.is_active = true
)
ON CONFLICT DO NOTHING;

-- 4. VERIFICAR SE OS PLANOS EXISTEM
-- =====================================================

-- Criar planos se não existirem
INSERT INTO public.plans (
  id,
  name,
  display_name,
  description,
  max_prompt_versions,
  max_tokens_per_month,
  can_share_chat,
  trial_days,
  price_monthly,
  price_yearly,
  is_active
) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'trial',
  'Trial Grátis',
  'Teste grátis de 7 dias com limitações',
  4,
  1000000,
  false,
  7,
  null,
  null,
  true
),
(
  '00000000-0000-0000-0000-000000000002',
  'premium',
  'Premium',
  'Plano premium com recursos ilimitados',
  -1,
  -1,
  true,
  null,
  99.90,
  999.00,
  true
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  max_prompt_versions = EXCLUDED.max_prompt_versions,
  max_tokens_per_month = EXCLUDED.max_tokens_per_month,
  can_share_chat = EXCLUDED.can_share_chat,
  trial_days = EXCLUDED.trial_days,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  is_active = EXCLUDED.is_active;

-- 5. VERIFICAR RESULTADOS
-- =====================================================

-- Mostrar todos os usuários e suas subscriptions
SELECT 
  u.id as user_id,
  u.email,
  COUNT(s.id) as subscription_count,
  STRING_AGG(s.status::text, ', ') as statuses,
  STRING_AGG(p.display_name, ', ') as plan_names
FROM auth.users u
LEFT JOIN public.subscriptions s ON s.user_id = u.id AND s.is_active = true
LEFT JOIN public.plans p ON p.id = s.plan_id
GROUP BY u.id, u.email
ORDER BY u.created_at DESC;

-- Mostrar detalhes das subscriptions ativas
SELECT 
  s.id,
  s.user_id,
  u.email,
  s.status,
  s.trial_ends_at,
  s.subscription_ends_at,
  p.display_name as plan_name,
  p.max_prompt_versions,
  p.max_tokens_per_month,
  p.can_share_chat,
  s.is_active,
  s.created_at
FROM public.subscriptions s
JOIN auth.users u ON u.id = s.user_id
LEFT JOIN public.plans p ON p.id = s.plan_id
WHERE s.is_active = true
ORDER BY s.created_at DESC;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Script executado com sucesso!';
  RAISE NOTICE '✅ Trigger on_auth_user_created criado/atualizado';
  RAISE NOTICE '✅ Subscriptions criadas para todos os usuários';
  RAISE NOTICE '✅ Planos verificados/criados';
  RAISE NOTICE '';
  RAISE NOTICE 'Agora o sistema SAAS deve funcionar corretamente!';
END $$;


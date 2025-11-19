-- =====================================================
-- CORREÇÃO: Adicionar coluna period_start na tabela usage_tracking
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- Adicionar coluna period_start se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_tracking' 
    AND column_name = 'period_start'
  ) THEN
    -- Adicionar coluna como nullable primeiro
    ALTER TABLE public.usage_tracking 
    ADD COLUMN period_start TIMESTAMPTZ;
    
    -- Atualizar valores NULL existentes com o início do mês baseado em usage_month e usage_year
    UPDATE public.usage_tracking 
    SET period_start = date_trunc('month', make_date(usage_year, usage_month, 1))
    WHERE period_start IS NULL;
    
    -- Agora tornar a coluna NOT NULL
    ALTER TABLE public.usage_tracking 
    ALTER COLUMN period_start SET NOT NULL;
    
    -- Definir valor padrão para novos registros
    ALTER TABLE public.usage_tracking 
    ALTER COLUMN period_start SET DEFAULT date_trunc('month', NOW());
    
    RAISE NOTICE 'Coluna period_start adicionada com sucesso';
  ELSE
    -- Se a coluna já existe, apenas atualizar valores NULL existentes
    UPDATE public.usage_tracking 
    SET period_start = date_trunc('month', make_date(usage_year, usage_month, 1))
    WHERE period_start IS NULL;
    
    -- Garantir que a coluna não permita NULL
    ALTER TABLE public.usage_tracking 
    ALTER COLUMN period_start SET NOT NULL;
    
    RAISE NOTICE 'Coluna period_start já existe, valores atualizados';
  END IF;
END $$;

-- Atualizar a função track_token_usage para incluir period_start
CREATE OR REPLACE FUNCTION track_token_usage(
  p_user_id UUID,
  p_tokens_used INTEGER,
  p_usage_type TEXT,
  p_model_used TEXT DEFAULT NULL,
  p_prompt_id UUID DEFAULT NULL,
  p_version_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_subscription_id UUID;
  v_usage_id UUID;
BEGIN
  -- Buscar subscription_id ativa
  SELECT id INTO v_subscription_id
  FROM public.subscriptions
  WHERE user_id = p_user_id
    AND is_active = true
    AND (
      (status = 'trial' AND trial_ends_at > NOW()) OR
      (status = 'active' AND (subscription_ends_at IS NULL OR subscription_ends_at > NOW()))
    )
  ORDER BY created_at DESC
  LIMIT 1;

  -- Inserir registro de uso
  INSERT INTO public.usage_tracking (
    user_id,
    subscription_id,
    usage_type,
    model_used,
    tokens_used,
    requests_count,
    usage_month,
    usage_year,
    prompt_id,
    version_id,
    period_start
  ) VALUES (
    p_user_id,
    v_subscription_id,
    p_usage_type,
    p_model_used,
    p_tokens_used,
    1,
    EXTRACT(MONTH FROM NOW()),
    EXTRACT(YEAR FROM NOW()),
    p_prompt_id,
    p_version_id,
    date_trunc('month', NOW())
  )
  RETURNING id INTO v_usage_id;

  RETURN v_usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar se tudo está correto
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'usage_tracking'
  AND column_name = 'period_start';


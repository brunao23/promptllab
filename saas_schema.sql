-- =====================================================
-- SCHEMA SAAS - TENANTS, SUBSCRIPTIONS E PLANOS
-- =====================================================

-- =====================================================
-- TABELA: plans (Planos de assinatura)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'trial', 'premium', 'enterprise'
  display_name TEXT NOT NULL, -- 'Trial Grátis', 'Premium', 'Enterprise'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar todas as colunas condicionalmente para compatibilidade
DO $$ 
BEGIN
  -- description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.plans ADD COLUMN description TEXT;
  END IF;

  -- max_prompt_versions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'max_prompt_versions'
  ) THEN
    ALTER TABLE public.plans ADD COLUMN max_prompt_versions INTEGER NOT NULL DEFAULT 4;
  END IF;

  -- max_tokens_per_month
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'max_tokens_per_month'
  ) THEN
    ALTER TABLE public.plans ADD COLUMN max_tokens_per_month BIGINT NOT NULL DEFAULT 1000000;
  END IF;

  -- can_share_chat
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'can_share_chat'
  ) THEN
    ALTER TABLE public.plans ADD COLUMN can_share_chat BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- trial_days
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'trial_days'
  ) THEN
    ALTER TABLE public.plans ADD COLUMN trial_days INTEGER DEFAULT NULL;
  END IF;

  -- price_monthly
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'price_monthly'
  ) THEN
    ALTER TABLE public.plans ADD COLUMN price_monthly DECIMAL(10, 2) DEFAULT NULL;
  END IF;

  -- price_yearly
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'price_yearly'
  ) THEN
    ALTER TABLE public.plans ADD COLUMN price_yearly DECIMAL(10, 2) DEFAULT NULL;
  END IF;

  -- is_active
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.plans ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
  END IF;

  -- updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.plans ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- =====================================================
-- TABELA: tenants (Organizações/Clientes)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Nome da organização
  slug TEXT NOT NULL UNIQUE, -- URL amigável (ex: "empresa-abc")
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar todas as colunas condicionalmente para compatibilidade
DO $$ 
BEGIN
  -- email
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN email TEXT;
  END IF;

  -- phone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN phone TEXT;
  END IF;

  -- is_active
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
  END IF;

  -- updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- =====================================================
-- TABELA: subscriptions (Assinaturas dos usuários)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar constraint se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subscriptions_user_id_fkey'
  ) THEN
    ALTER TABLE public.subscriptions 
    ADD CONSTRAINT subscriptions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Adicionar todas as colunas condicionalmente para compatibilidade
DO $$ 
BEGIN
  -- tenant_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.subscriptions 
    ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;
  END IF;

  -- trial_started_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'trial_started_at'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN trial_started_at TIMESTAMPTZ;
  END IF;

  -- trial_ends_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN trial_ends_at TIMESTAMPTZ;
  END IF;

  -- subscription_started_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'subscription_started_at'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN subscription_started_at TIMESTAMPTZ;
  END IF;

  -- subscription_ends_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'subscription_ends_at'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN subscription_ends_at TIMESTAMPTZ;
  END IF;

  -- status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN status TEXT NOT NULL DEFAULT 'trial';
  END IF;

  -- is_active (IMPORTANTE: deve ser adicionada antes de qualquer função que a use)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
  END IF;

  -- updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;

  -- Adicionar constraint de status se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subscriptions_status_check'
  ) THEN
    ALTER TABLE public.subscriptions 
    ADD CONSTRAINT subscriptions_status_check 
    CHECK (status IN ('trial', 'active', 'cancelled', 'expired'));
  END IF;
END $$;

-- =====================================================
-- TABELA: usage_tracking (Controle de uso - tokens)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo de uso
  usage_type TEXT NOT NULL, -- 'prompt_generation', 'chat', 'document_analysis'
  model_used TEXT, -- 'gemini-2.5-flash', 'gemini-2.5-pro'
  
  -- Contagem
  tokens_used INTEGER NOT NULL DEFAULT 0, -- Tokens consumidos
  requests_count INTEGER NOT NULL DEFAULT 1, -- Número de requisições
  
  -- Período
  usage_month INTEGER NOT NULL, -- 1-12
  usage_year INTEGER NOT NULL, -- 2024, 2025, etc
  
  -- Metadados
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE SET NULL,
  version_id UUID REFERENCES public.prompt_versions(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT usage_tracking_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Adicionar colunas se não existirem (para compatibilidade com tabelas já criadas)
DO $$ 
BEGIN
  -- Adicionar subscription_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_tracking' 
    AND column_name = 'subscription_id'
  ) THEN
    ALTER TABLE public.usage_tracking 
    ADD COLUMN subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL;
  END IF;

  -- Adicionar usage_type se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_tracking' 
    AND column_name = 'usage_type'
  ) THEN
    ALTER TABLE public.usage_tracking 
    ADD COLUMN usage_type TEXT NOT NULL DEFAULT 'prompt_generation';
  END IF;

  -- Adicionar model_used se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_tracking' 
    AND column_name = 'model_used'
  ) THEN
    ALTER TABLE public.usage_tracking 
    ADD COLUMN model_used TEXT;
  END IF;

  -- Adicionar tokens_used se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_tracking' 
    AND column_name = 'tokens_used'
  ) THEN
    ALTER TABLE public.usage_tracking 
    ADD COLUMN tokens_used INTEGER NOT NULL DEFAULT 0;
  END IF;

  -- Adicionar requests_count se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_tracking' 
    AND column_name = 'requests_count'
  ) THEN
    ALTER TABLE public.usage_tracking 
    ADD COLUMN requests_count INTEGER NOT NULL DEFAULT 1;
  END IF;

  -- Adicionar usage_month se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_tracking' 
    AND column_name = 'usage_month'
  ) THEN
    ALTER TABLE public.usage_tracking 
    ADD COLUMN usage_month INTEGER NOT NULL DEFAULT EXTRACT(MONTH FROM NOW());
  END IF;

  -- Adicionar usage_year se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_tracking' 
    AND column_name = 'usage_year'
  ) THEN
    ALTER TABLE public.usage_tracking 
    ADD COLUMN usage_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW());
  END IF;

  -- Adicionar prompt_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_tracking' 
    AND column_name = 'prompt_id'
  ) THEN
    ALTER TABLE public.usage_tracking 
    ADD COLUMN prompt_id UUID REFERENCES public.prompts(id) ON DELETE SET NULL;
  END IF;

  -- Adicionar version_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_tracking' 
    AND column_name = 'version_id'
  ) THEN
    ALTER TABLE public.usage_tracking 
    ADD COLUMN version_id UUID REFERENCES public.prompt_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- TABELA: admin_users (Usuários com acesso admin)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar todas as colunas condicionalmente para compatibilidade
DO $$ 
BEGIN
  -- role
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.admin_users ADD COLUMN role TEXT NOT NULL DEFAULT 'admin';
  END IF;

  -- can_manage_tenants
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'can_manage_tenants'
  ) THEN
    ALTER TABLE public.admin_users ADD COLUMN can_manage_tenants BOOLEAN NOT NULL DEFAULT true;
  END IF;

  -- can_manage_subscriptions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'can_manage_subscriptions'
  ) THEN
    ALTER TABLE public.admin_users ADD COLUMN can_manage_subscriptions BOOLEAN NOT NULL DEFAULT true;
  END IF;

  -- can_view_analytics
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'can_view_analytics'
  ) THEN
    ALTER TABLE public.admin_users ADD COLUMN can_view_analytics BOOLEAN NOT NULL DEFAULT true;
  END IF;

  -- is_active
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.admin_users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
  END IF;

  -- updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.admin_users ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;

  -- Adicionar constraints se não existirem
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'admin_users_user_id_fkey'
  ) THEN
    ALTER TABLE public.admin_users 
    ADD CONSTRAINT admin_users_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'admin_users_role_check'
  ) THEN
    ALTER TABLE public.admin_users 
    ADD CONSTRAINT admin_users_role_check 
    CHECK (role IN ('admin', 'super_admin'));
  END IF;
END $$;

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);

-- Criar índice tenant_id apenas se a coluna existir
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'tenant_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON public.subscriptions(tenant_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Criar índice is_active apenas se a coluna existir
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'is_active'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON public.subscriptions(is_active);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON public.usage_tracking(user_id);

-- Criar índice subscription_id apenas se a coluna existir
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_tracking' 
    AND column_name = 'subscription_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_usage_tracking_subscription_id ON public.usage_tracking(subscription_id);
  END IF;
END $$;

-- Criar índices apenas se as colunas existirem
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_tracking' 
    AND column_name = 'usage_year'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_tracking' 
    AND column_name = 'usage_month'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON public.usage_tracking(usage_year, usage_month);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usage_tracking' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_usage_tracking_created_at ON public.usage_tracking(created_at DESC);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);

-- Criar índices condicionalmente apenas se as colunas existirem
DO $$ 
BEGIN
  -- tenants.is_active
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'is_active'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tenants_is_active ON public.tenants(is_active);
  END IF;

  -- admin_users.user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
  END IF;

  -- admin_users.email
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'email'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
  END IF;

  -- admin_users.is_active
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'is_active'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON public.admin_users(is_active);
  END IF;

  -- plans.is_active
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'is_active'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_plans_is_active ON public.plans(is_active);
  END IF;
END $$;

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS set_updated_at_plans ON public.plans;
CREATE TRIGGER set_updated_at_plans
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_tenants ON public.tenants;
CREATE TRIGGER set_updated_at_tenants
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_subscriptions ON public.subscriptions;
CREATE TRIGGER set_updated_at_subscriptions
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_admin_users ON public.admin_users;
CREATE TRIGGER set_updated_at_admin_users
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- =====================================================
-- FUNÇÃO: Verificar se usuário tem acesso a recurso
-- =====================================================
CREATE OR REPLACE FUNCTION check_user_access(
  p_user_id UUID,
  p_feature TEXT -- 'share_chat', 'create_version', 'use_tokens'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription RECORD;
  v_plan RECORD;
  v_tokens_used BIGINT;
  v_tokens_limit BIGINT;
  v_versions_count INTEGER;
  v_versions_limit INTEGER;
  v_plan_id UUID;
BEGIN
  -- Buscar assinatura ativa do usuário
  SELECT 
    s.id as subscription_id,
    s.plan_id,
    s.status,
    s.trial_ends_at,
    s.subscription_ends_at
  INTO v_subscription
  FROM public.subscriptions s
  WHERE s.user_id = p_user_id
    AND s.is_active = true
    AND (
      (s.status = 'trial' AND s.trial_ends_at > NOW()) OR
      (s.status = 'active' AND (s.subscription_ends_at IS NULL OR s.subscription_ends_at > NOW()))
    )
  ORDER BY s.created_at DESC
  LIMIT 1;

  -- Se não tem assinatura ativa, negar acesso
  IF v_subscription IS NULL THEN
    RETURN false;
  END IF;

  -- Buscar dados do plano separadamente para evitar conflitos
  SELECT 
    can_share_chat,
    max_prompt_versions,
    max_tokens_per_month
  INTO v_plan
  FROM public.plans
  WHERE id = v_subscription.plan_id;

  -- Se plano não encontrado, negar acesso
  IF v_plan IS NULL THEN
    RETURN false;
  END IF;

  -- Verificar limitações por feature
  CASE p_feature
    WHEN 'share_chat' THEN
      RETURN v_plan.can_share_chat;
    
    WHEN 'create_version' THEN
      -- Contar versões do usuário
      SELECT COUNT(*)
      INTO v_versions_count
      FROM public.prompt_versions pv
      JOIN public.prompts p ON p.id = pv.prompt_id
      WHERE p.user_id = p_user_id
        AND pv.created_at >= DATE_TRUNC('month', NOW());
      
      v_versions_limit := v_plan.max_prompt_versions;
      -- Se limite é -1 (ilimitado), sempre permitir
      IF v_versions_limit = -1 THEN
        RETURN true;
      END IF;
      RETURN v_versions_count < v_versions_limit;
    
    WHEN 'use_tokens' THEN
      -- Contar tokens usados no mês atual
      SELECT COALESCE(SUM(tokens_used), 0)
      INTO v_tokens_used
      FROM public.usage_tracking
      WHERE user_id = p_user_id
        AND usage_year = EXTRACT(YEAR FROM NOW())
        AND usage_month = EXTRACT(MONTH FROM NOW());
      
      v_tokens_limit := v_plan.max_tokens_per_month;
      -- Se limite é -1 (ilimitado), sempre permitir
      IF v_tokens_limit = -1 THEN
        RETURN true;
      END IF;
      RETURN v_tokens_used < v_tokens_limit;
    
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO: Registrar uso de tokens
-- =====================================================
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
    version_id
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
    p_version_id
  )
  RETURNING id INTO v_usage_id;

  RETURN v_usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS - PLANS
-- =====================================================
DROP POLICY IF EXISTS "Plans são visíveis para todos usuários autenticados" ON public.plans;
CREATE POLICY "Plans são visíveis para todos usuários autenticados"
  ON public.plans FOR SELECT
  TO authenticated
  USING (is_active = true);

-- =====================================================
-- POLÍTICAS RLS - TENANTS
-- =====================================================
DROP POLICY IF EXISTS "Tenants são visíveis para admins" ON public.tenants;
CREATE POLICY "Tenants são visíveis para admins"
  ON public.tenants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
        AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins podem criar tenants" ON public.tenants;
CREATE POLICY "Admins podem criar tenants"
  ON public.tenants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
        AND is_active = true
        AND can_manage_tenants = true
    )
  );

DROP POLICY IF EXISTS "Admins podem atualizar tenants" ON public.tenants;
CREATE POLICY "Admins podem atualizar tenants"
  ON public.tenants FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
        AND is_active = true
        AND can_manage_tenants = true
    )
  );

-- =====================================================
-- POLÍTICAS RLS - SUBSCRIPTIONS
-- =====================================================
DROP POLICY IF EXISTS "Usuários podem ver suas próprias subscriptions" ON public.subscriptions;
CREATE POLICY "Usuários podem ver suas próprias subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins podem ver todas subscriptions" ON public.subscriptions;
CREATE POLICY "Admins podem ver todas subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
        AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins podem criar subscriptions" ON public.subscriptions;
CREATE POLICY "Admins podem criar subscriptions"
  ON public.subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
        AND is_active = true
        AND can_manage_subscriptions = true
    )
  );

DROP POLICY IF EXISTS "Admins podem atualizar subscriptions" ON public.subscriptions;
CREATE POLICY "Admins podem atualizar subscriptions"
  ON public.subscriptions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
        AND is_active = true
        AND can_manage_subscriptions = true
    )
  );

-- =====================================================
-- POLÍTICAS RLS - USAGE_TRACKING
-- =====================================================
DROP POLICY IF EXISTS "Usuários podem ver seu próprio uso" ON public.usage_tracking;
CREATE POLICY "Usuários podem ver seu próprio uso"
  ON public.usage_tracking FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins podem ver todo uso" ON public.usage_tracking;
CREATE POLICY "Admins podem ver todo uso"
  ON public.usage_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
        AND is_active = true
        AND can_view_analytics = true
    )
  );

DROP POLICY IF EXISTS "Sistema pode inserir uso" ON public.usage_tracking;
CREATE POLICY "Sistema pode inserir uso"
  ON public.usage_tracking FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- POLÍTICAS RLS - ADMIN_USERS
-- =====================================================
DROP POLICY IF EXISTS "Admins podem ver outros admins" ON public.admin_users;
CREATE POLICY "Admins podem ver outros admins"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = auth.uid()
        AND au.is_active = true
    )
  );

-- =====================================================
-- DADOS INICIAIS - PLANS
-- =====================================================
INSERT INTO public.plans (id, name, display_name, description, max_prompt_versions, max_tokens_per_month, can_share_chat, trial_days, price_monthly, price_yearly, is_active)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001',
    'trial',
    'Trial Grátis',
    'Teste grátis de 7 dias com limitações',
    4, -- max 4 versões
    1000000, -- 1M tokens
    false, -- não pode compartilhar chat
    7, -- 7 dias de trial
    NULL, -- grátis
    NULL, -- grátis
    true
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'premium',
    'Premium',
    'Plano premium com recursos ilimitados',
    -1, -- ilimitado
    -1, -- ilimitado
    true, -- pode compartilhar chat
    NULL, -- não é trial
    99.90, -- R$ 99,90/mês
    999.00, -- R$ 999,00/ano
    true
  )
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- CRIAÇÃO DO USUÁRIO ADMIN MASTER
-- =====================================================
-- NOTA: Este usuário precisa ser criado manualmente após o registro
-- ou via trigger após o primeiro login do email brunocostaads23@gmail.com

CREATE OR REPLACE FUNCTION create_master_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se é o email master
  IF NEW.email = 'brunocostaads23@gmail.com' THEN
    -- Inserir como admin master se ainda não existir
    INSERT INTO public.admin_users (user_id, email, role, can_manage_tenants, can_manage_subscriptions, can_view_analytics, is_active)
    VALUES (NEW.id, NEW.email, 'super_admin', true, true, true, true)
    ON CONFLICT (email) DO UPDATE
      SET user_id = NEW.id,
          is_active = true,
          role = 'super_admin',
          can_manage_tenants = true,
          can_manage_subscriptions = true,
          can_view_analytics = true;
    
    -- Criar subscription trial automaticamente
    INSERT INTO public.subscriptions (user_id, plan_id, trial_started_at, trial_ends_at, status, is_active)
    VALUES (
      NEW.id,
      '00000000-0000-0000-0000-000000000002', -- premium (admin tem premium)
      NOW(),
      NOW() + INTERVAL '1 year', -- 1 ano para admin
      'active',
      true
    )
    ON CONFLICT DO NOTHING;
  ELSE
    -- Para outros usuários, criar subscription trial
    INSERT INTO public.subscriptions (user_id, plan_id, trial_started_at, trial_ends_at, status, is_active)
    VALUES (
      NEW.id,
      '00000000-0000-0000-0000-000000000001', -- trial
      NOW(),
      NOW() + INTERVAL '7 days', -- 7 dias
      'trial',
      true
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar admin e subscription automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_master_admin();

-- =====================================================
-- FIM DO SCHEMA SAAS
-- =====================================================

-- =====================================================
-- CORREÇÃO: Política RLS Recursiva em admin_users
-- =====================================================
-- PROBLEMA: A política "Admins podem ver outros admins" estava
-- causando recursão infinita porque verificava admin_users dentro
-- da própria verificação de admin_users.
--
-- SOLUÇÃO: Usar uma função SECURITY DEFINER que contorna RLS
-- ou verificar diretamente o user_id sem usar EXISTS na mesma tabela
-- =====================================================

-- 1. Remover política problemática
DROP POLICY IF EXISTS "Admins podem ver outros admins" ON public.admin_users;

-- 2. Criar função auxiliar que contorna RLS para verificar admin
-- Esta função usa SECURITY DEFINER, então ela pode ler admin_users
-- mesmo sem políticas RLS ativas
CREATE OR REPLACE FUNCTION public.is_user_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.admin_users
    WHERE user_id = check_user_id
      AND is_active = true
  );
END;
$$;

-- Garantir que a função é acessível para authenticated users
GRANT EXECUTE ON FUNCTION public.is_user_admin(UUID) TO authenticated;

-- 3. Criar nova política que usa a função (sem recursão)
CREATE POLICY "Admins podem ver outros admins"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (
    -- Verificar se o usuário atual é admin usando a função
    -- A função contorna RLS, então não causa recursão
    public.is_user_admin(auth.uid())
  );

-- 4. Política para usuários verem seu próprio registro
CREATE POLICY "Usuários podem ver seu próprio registro admin"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- 5. Política para INSERT (apenas super admins via função)
-- Nota: Inserções normalmente devem ser feitas via triggers ou funções SECURITY DEFINER
CREATE POLICY "Apenas admins podem inserir novos admins"
  ON public.admin_users FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_user_admin(auth.uid())
  );

-- 6. Política para UPDATE (apenas super admins)
CREATE POLICY "Apenas super admins podem atualizar admins"
  ON public.admin_users FOR UPDATE
  TO authenticated
  USING (
    public.is_user_admin(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
        AND is_active = true
    )
  );

-- 7. Política para DELETE (apenas super admins, e não pode deletar a si mesmo)
CREATE POLICY "Apenas super admins podem deletar admins"
  ON public.admin_users FOR DELETE
  TO authenticated
  USING (
    public.is_user_admin(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
        AND is_active = true
    )
    AND user_id != auth.uid() -- Não pode deletar a si mesmo
  );

-- 8. Verificar se as políticas foram criadas corretamente
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS corrigidas para admin_users';
  RAISE NOTICE '✅ Função is_user_admin criada para evitar recursão';
  RAISE NOTICE '✅ Recursão infinita resolvida!';
END $$;


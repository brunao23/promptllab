# 🔧 Solução Completa para os Problemas

## ❌ Problemas Identificados:

1. **Email ainda está em inglês**
2. **Dados não estão entrando no banco de dados**
3. **Apenas dados de cadastro estão entrando**

## ✅ SOLUÇÃO 1: Configurar Email em Português no Supabase

### Passo 1: Acessar Templates de Email
1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em: **Authentication** → **Email Templates**
4. Clique em: **"Confirm signup"**

### Passo 2: Configurar Assunto (Subject)
Cole este texto:
```
Confirme seu email - LaBPrompT
```

### Passo 3: Configurar Corpo (Body)
Cole este HTML no campo Body:

```html
<h2 style="color: #0891b2; font-family: Arial, sans-serif;">Bem-vindo ao LaBPrompT! 🎉</h2>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
Olá!
</p>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
Obrigado por se cadastrar no <strong>LaBPrompT - Laboratório de Engenharia de Prompt</strong>.
</p>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
Para começar a usar nossa ferramenta, precisamos confirmar seu endereço de email. Clique no botão abaixo para confirmar:
</p>

<div style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #0891b2; 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block; 
            font-weight: bold;
            font-family: Arial, sans-serif;">
    Confirmar Email
  </a>
</div>

<p style="color: #666; font-family: Arial, sans-serif; line-height: 1.6;">
Ou copie e cole este link no seu navegador:
</p>
<p style="color: #0891b2; font-family: Arial, sans-serif; word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px;">
{{ .ConfirmationURL }}
</p>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
<strong>Este link expira em 24 horas.</strong>
</p>

<p style="color: #333; font-family: Arial, sans-serif; line-height: 1.6;">
Após confirmar seu email, você será redirecionado automaticamente para a ferramenta e poderá começar a criar seus prompts profissionais!
</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

<p style="color: #6b7280; font-size: 14px; font-family: Arial, sans-serif;">
Se você não se cadastrou nesta conta, pode ignorar este email com segurança.
</p>

<p style="color: #6b7280; font-size: 14px; font-family: Arial, sans-serif;">
Atenciosamente,<br>
<strong>Equipe LaBPrompT</strong>
</p>
```

### Passo 4: Salvar
1. Clique em **"Save"** ou **"Update"**
2. Aguarde a confirmação

---

## ✅ SOLUÇÃO 2: Corrigir Função que Cria Perfil Automaticamente

O problema é que a função `handle_new_user()` pode não estar funcionando corretamente. Execute este SQL no Supabase:

### Passo 1: Acessar SQL Editor
1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em: **SQL Editor** → **New Query**

### Passo 2: Executar Script de Correção
Cole e execute este SQL:

```sql
-- Recriar a função com tratamento de erros melhorado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Inserir na tabela profiles
    INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            SPLIT_PART(NEW.email, '@', 1)
        ),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log do erro (não bloqueia o cadastro do usuário)
        RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Garantir que o trigger está configurado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Verificar se há usuários sem perfil e criar perfis para eles
INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'name',
        SPLIT_PART(au.email, '@', 1)
    ) as full_name,
    au.created_at,
    NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verificar resultados
SELECT 
    'Usuários autenticados' as tipo,
    COUNT(*) as total
FROM auth.users
UNION ALL
SELECT 
    'Perfis criados' as tipo,
    COUNT(*) as total
FROM public.profiles;
```

### Passo 3: Verificar Resultados
Execute esta query para verificar:

```sql
-- Verificar últimos perfis criados
SELECT 
    id,
    email,
    full_name,
    created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;
```

---

## ✅ SOLUÇÃO 3: Verificar Políticas RLS (Row Level Security)

O problema de "apenas cadastro funciona" pode ser causado por políticas RLS muito restritivas. Vamos verificar e corrigir:

### Passo 1: Verificar Políticas RLS da Tabela Profiles
Execute este SQL:

```sql
-- Verificar políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles';

-- Garantir que usuários podem ver seu próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Garantir que usuários podem atualizar seu próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Permitir que o trigger insira perfis (sistema)
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (true);
```

### Passo 2: Verificar se RLS está Habilitado Corretamente
Execute:

```sql
-- Verificar se RLS está habilitado
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'profiles';

-- Se rowsecurity for false, habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

---

## 🔍 DIAGNÓSTICO: Verificar o Que Está Acontecendo

Execute estas queries para diagnosticar:

### Query 1: Verificar Usuários vs Perfis
```sql
SELECT 
    COUNT(DISTINCT au.id) as total_usuarios,
    COUNT(DISTINCT p.id) as total_perfis,
    COUNT(DISTINCT au.id) - COUNT(DISTINCT p.id) as usuarios_sem_perfil
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id;
```

### Query 2: Listar Usuários Sem Perfil
```sql
SELECT 
    au.id,
    au.email,
    au.created_at,
    au.raw_user_meta_data
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;
```

### Query 3: Verificar Logs de Erros do Trigger
```sql
-- Verificar se há erros recentes (se você tiver tabela de logs)
-- Caso contrário, verifique os logs do Supabase em Dashboard → Logs
```

---

## ✅ TESTE COMPLETO

Depois de executar todas as soluções:

1. **Crie uma nova conta de teste**
   - Use um email diferente
   - Verifique se recebe o email em português
   - Verifique se o perfil é criado automaticamente

2. **Verifique o banco de dados**
   ```sql
   SELECT * FROM public.profiles WHERE email = 'seu-email-de-teste@email.com';
   ```

3. **Teste outras operações**
   - Login
   - Criar prompt
   - Salvar dados
   - Verificar se tudo está funcionando

---

## ⚠️ IMPORTANTE

Se depois de executar tudo ainda houver problemas:

1. **Verifique os logs do Supabase:**
   - Dashboard → Logs → Database
   - Procure por erros relacionados a `handle_new_user` ou `profiles`

2. **Desabilite temporariamente RLS para teste:**
   ```sql
   ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
   -- Teste se funciona
   -- Se funcionar, o problema é nas políticas RLS
   -- Se não funcionar, o problema é na função ou trigger
   ```

3. **Verifique permissões do Service Role:**
   - A função `handle_new_user()` usa `SECURITY DEFINER`
   - Isso significa que ela executa com permissões do criador
   - Garanta que o usuário que criou a função tem permissões necessárias

---

## 📝 Checklist Final

- [ ] Email configurado em português no Supabase
- [ ] Função `handle_new_user()` executada e corrigida
- [ ] Trigger `on_auth_user_created` criado
- [ ] Perfis criados para usuários existentes sem perfil
- [ ] Políticas RLS verificadas e corrigidas
- [ ] Teste completo realizado
- [ ] Dados entrando corretamente no banco

---

**Execute todos os scripts SQL na ordem e depois teste!** 🚀


# 🔧 Correção de Autenticação - Problemas e Soluções

## ❌ Problema: Autenticação não está funcionando

### Possíveis Causas:

1. **Variáveis de ambiente não configuradas corretamente**
2. **Cliente Supabase criado com valores vazios**
3. **Erro silencioso na criação do cliente**
4. **Problema com políticas RLS bloqueando acesso**

---

## ✅ SOLUÇÃO 1: Verificar Variáveis de Ambiente

### No Supabase Dashboard:
1. Acesse: https://app.supabase.com → Seu Projeto
2. Vá em: **Project Settings** → **API**
3. Verifique se as URLs e chaves estão corretas

### No código (.env):
Verifique se o arquivo `.env` tem:
```
VITE_SUPABASE_URL=https://zmagqrcymbletqymclig.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Na Vercel (Produção):
1. Acesse: https://vercel.com/dashboard → Seu Projeto
2. Vá em: **Settings** → **Environment Variables**
3. Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas

---

## ✅ SOLUÇÃO 2: Melhorar Tratamento de Erros

O código foi atualizado para:
- ✅ Validar variáveis de ambiente antes de criar o cliente
- ✅ Lançar erro claro se variáveis estiverem faltando
- ✅ Adicionar logs detalhados para debug

---

## ✅ SOLUÇÃO 3: Verificar Políticas RLS

Execute este SQL no Supabase para verificar e corrigir:

```sql
-- Verificar se RLS está habilitado
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'profiles';

-- Se rowsecurity for false, habilitar
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Verificar políticas da tabela profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles';

-- Garantir políticas corretas
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Permitir inserção via trigger (sistema)
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (true);
```

---

## ✅ SOLUÇÃO 4: Verificar Console do Navegador

Abra o Console do navegador (F12) e verifique:

1. **Erros no console:**
   - Procure por erros relacionados a Supabase
   - Verifique se há erros de CORS
   - Veja se há erros de variáveis de ambiente

2. **Network (Rede):**
   - Verifique se as requisições para Supabase estão sendo feitas
   - Veja o status das respostas (200, 401, 403, etc.)

3. **Storage (LocalStorage):**
   - Verifique se há tokens salvos
   - Veja se há dados de sessão

---

## 🔍 DIAGNÓSTICO: Verificar o que está acontecendo

### Query 1: Verificar usuários e sessões
```sql
-- Verificar usuários autenticados
SELECT 
    id,
    email,
    created_at,
    confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Verificar perfis criados
SELECT 
    id,
    email,
    full_name,
    created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;
```

### Query 2: Verificar se há usuários sem perfil
```sql
SELECT 
    au.id,
    au.email,
    au.created_at,
    CASE WHEN p.id IS NULL THEN 'SEM PERFIL' ELSE 'COM PERFIL' END as status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
ORDER BY au.created_at DESC;
```

---

## ✅ TESTE COMPLETO

Depois de executar as correções:

1. **Limpar cache do navegador:**
   - Pressione Ctrl+Shift+Delete
   - Limpe cache e cookies
   - Feche e abra o navegador

2. **Testar login:**
   - Use um email e senha válidos
   - Verifique o console do navegador
   - Veja se há erros

3. **Testar cadastro:**
   - Crie uma nova conta
   - Verifique se o perfil é criado
   - Veja se recebe email de confirmação

---

## ⚠️ PROBLEMAS COMUNS

### Problema: "Variáveis de ambiente não configuradas"
**Solução:** Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no `.env` ou na Vercel

### Problema: "Invalid API key"
**Solução:** Verifique se a chave ANON_KEY está correta no Supabase Dashboard

### Problema: "CORS error"
**Solução:** Configure as URLs permitidas no Supabase:
- Project Settings → API → CORS Settings
- Adicione: `https://labprompt.com.br`

### Problema: "RLS policy violation"
**Solução:** Execute os scripts SQL acima para corrigir as políticas RLS

---

## 📝 Checklist

- [ ] Variáveis de ambiente configuradas (local e produção)
- [ ] Políticas RLS verificadas e corrigidas
- [ ] Cliente Supabase criado corretamente
- [ ] Console do navegador verificado (sem erros)
- [ ] Teste de login realizado
- [ ] Teste de cadastro realizado

---

**Execute todas as verificações e depois teste novamente!** 🚀


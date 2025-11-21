# 🚨 EXECUTE ESTES 3 SCRIPTS NO SUPABASE AGORA

## 📍 Onde executar:
https://supabase.com/dashboard → **SQL Editor**

---

## ✅ SCRIPT 1: Corrigir Admin Master e Premium Ilimitado

**Arquivo:** `CORRIGIR_ADMIN_MASTER_AGORA.sql`

**O que faz:**
- ✅ Cria seu profile
- ✅ Te registra como super_admin
- ✅ Cria subscription PREMIUM ilimitada
- ✅ Corrige policies RLS

**Execute:** Copie TODO o conteúdo e cole no SQL Editor, clique RUN

---

## ✅ SCRIPT 2: Corrigir RLS de API Keys

**Arquivo:** `CORRIGIR_RLS_API_KEYS.sql`

**O que faz:**
- ✅ Corrige permissões para salvar API keys
- ✅ Permite INSERT, UPDATE, DELETE de suas próprias chaves

**Execute:** Copie TODO o conteúdo e cole no SQL Editor, clique RUN

---

## ✅ SCRIPT 3: Verificação Final

Cole e execute isto no SQL Editor:

```sql
-- Verificar se tudo está OK
SELECT 
    'ADMIN' as tipo,
    ad.role,
    ad.is_active
FROM admin_users ad
WHERE ad.email = 'brunocostaads23@gmail.com'

UNION ALL

SELECT 
    'SUBSCRIPTION' as tipo,
    s.status,
    s.is_active::text
FROM subscriptions s
JOIN auth.users u ON s.user_id = u.id
WHERE u.email = 'brunocostaads23@gmail.com'
AND s.is_active = true

UNION ALL

SELECT 
    'PLAN' as tipo,
    p.display_name,
    p.max_prompt_versions::text
FROM subscriptions s
JOIN auth.users u ON s.user_id = u.id
JOIN plans p ON s.plan_id = p.id
WHERE u.email = 'brunocostaads23@gmail.com'
AND s.is_active = true;
```

**Resultado esperado:**
```
tipo         | role/status/display_name       | is_active/max_versions
-------------|--------------------------------|----------------------
ADMIN        | super_admin                    | true
SUBSCRIPTION | active                         | true
PLAN         | 🔐 Admin Premium Master       | 999999
```

---

## 🔥 DEPOIS DE EXECUTAR OS 3 SCRIPTS:

1. **No site, clique no botão 💣 (laranja)** - limpa cache
2. **Faça login novamente**
3. **Deve aparecer:**
   - Sidebar: **"🔐 Admin Master - MASTER"**
   - Sidebar: **"♾️ Acesso Ilimitado"**
4. **Tente adicionar API Key novamente**
   - Agora deve funcionar!

---

## 💡 SE A API KEY AINDA NÃO FUNCIONAR:

Depois de executar os scripts, tente adicionar a API key e:

1. Abra o console (F12)
2. Procure por logs que começam com:
   - `🔑 [SettingsPage]`
   - `💾 [saveUserApiKey]`
   - `❌` (erros)
3. Me envie o que aparecer

---

**EXECUTE OS 3 SCRIPTS NA ORDEM E DEPOIS CLIQUE NO BOTÃO 💣!**

O deploy da Vercel também está rodando em paralelo (2-5 min).


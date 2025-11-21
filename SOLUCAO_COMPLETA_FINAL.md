# 🚨 SOLUÇÃO COMPLETA E FINAL (10 MINUTOS)

## ✅ Deploy Corrigido - Build passando agora!

---

# 🎯 FAÇA ISSO NA ORDEM (3 partes):

## PARTE 1: CONFIGURAR VERCEL (3 minutos)

### 1.1 Adicionar GEMINI_API_KEY

1. Acesse: **https://vercel.com/dashboard**
2. Projeto: **labprompt** ou **promptllab**
3. **Settings** → **Environment Variables** → **"Add New"**
4. Configure:
   ```
   Name: GEMINI_API_KEY
   Value: AIzaSyC5NFjPC1agckBYc2WUzCf0W-ua_AhXMrQ
   Environments: ✅ Production ✅ Preview ✅ Development
   ```
5. **Save**

### 1.2 Adicionar SUPABASE_SERVICE_ROLE_KEY

1. **Em outra aba:** https://supabase.com/dashboard
2. Seu projeto → **Settings** → **API**
3. Copie a **"service_role"** key (clique em Reveal)
4. **Volte para Vercel** → **"Add New"**
5. Configure:
   ```
   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: (cole a chave do Supabase)
   Environments: ✅ Production ✅ Preview ✅ Development
   ```
6. **Save**

### 1.3 Redesenhar

1. **Deployments** → **...** no último deploy → **"Redeploy"**
2. **Aguarde 2-3 min** até ✅ Ready

---

## PARTE 2: EXECUTAR SCRIPTS SQL (3 minutos)

### 2.1 Script de Admin Master

1. Supabase Dashboard → **SQL Editor**
2. Copie: **`CORRIGIR_ADMIN_MASTER_AGORA.sql`**
3. Cole e clique **RUN**

### 2.2 Script de API Keys

1. Copie: **`CORRIGIR_RLS_API_KEYS.sql`**
2. Cole e clique **RUN**

### 2.3 Verificar Relationship

1. Copie e execute:
```sql
SELECT 
    u.email,
    p.id as profile_id,
    s.id as subscription_id,
    s.status,
    pl.display_name
FROM auth.users u
JOIN profiles p ON u.id = p.id
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.is_active = true
LEFT JOIN plans pl ON s.plan_id = pl.id
WHERE u.email = 'brunocostaads23@gmail.com';
```

**Deve mostrar:**
- profile_id: (seu id)
- subscription_id: (um id)
- status: active
- display_name: 🔐 Admin Premium Master

✅ Se viu isso, tá OK!

---

## PARTE 3: TESTAR NO SITE (2 minutos)

### 3.1 Limpar Cache

1. Site: **https://labprompt.com.br**
2. Clique no **💣 (laranja)**

### 3.2 Login

1. Faça login com: `brunocostaads23@gmail.com`

### 3.3 Verificar

**Na Sidebar deve aparecer:**
```
🔐 Admin Master          MASTER
♾️ Acesso Ilimitado Permanente
Tokens: 0 / ♾️ Ilimitado
```

**No Header deve aparecer:**
- Botão **🔐** (verde) para admin

### 3.4 Testar Geração

1. Preencha **Persona** e **Objetivo**
2. Clique **"Gerar Prompt Mestre"**
3. **DEVE FUNCIONAR sem pedir API Key!**

### 3.5 Testar Criar Usuário

1. Clique no botão **🔐** (admin)
2. Vá em **Usuários**
3. Clique **"Criar Usuário Premium"**
4. Preencha e clique criar
5. **DEVE FUNCIONAR!**

---

## 🔴 SE DER ERRO "Could not find relationship":

Execute no Supabase SQL Editor:

```sql
-- Restart API
NOTIFY pgrst, 'reload schema';
```

Ou vá em: **Settings** → **API** → **"Restart API Server"**

Aguarde 1 minuto e tente novamente.

---

## ✅ CHECKLIST COMPLETO

- [ ] GEMINI_API_KEY adicionada na Vercel
- [ ] SUPABASE_SERVICE_ROLE_KEY adicionada na Vercel
- [ ] Redesenhar feito e deploy ✅ Ready
- [ ] Script CORRIGIR_ADMIN_MASTER_AGORA.sql executado
- [ ] Script CORRIGIR_RLS_API_KEYS.sql executado
- [ ] Botão 💣 clicado
- [ ] Login feito
- [ ] Sidebar mostra "Admin Master - MASTER"
- [ ] Gerar prompt funciona
- [ ] Criar usuário funciona

---

## 🆘 SE AINDA HOUVER PROBLEMAS

Abra o console (F12) e me envie logs que começam com:
- ❌ (erros)
- 🔑 [getAI]
- 🔐 [API]

---

**FAÇA AS 3 PARTES NA ORDEM AGORA!** 🚀

Tempo total: ~10 minutos


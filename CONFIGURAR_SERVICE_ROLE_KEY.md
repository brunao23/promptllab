# 🔐 CONFIGURAR SERVICE ROLE KEY NA VERCEL

## ⚠️ NECESSÁRIO PARA:
- ✅ Criar usuários pelo painel de admin
- ✅ Operações administrativas avançadas

---

## 📋 PASSO A PASSO (2 minutos):

### 1. Obter a Service Role Key do Supabase (1 min)

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **API** (menu lateral)
4. Role até a seção **"Project API keys"**
5. Encontre a chave **"service_role"** (secret)
6. Clique em **"Reveal"** e copie a chave

⚠️ **IMPORTANTE:** Esta chave é SECRETA! NUNCA exponha no frontend!

---

### 2. Adicionar na Vercel (1 min)

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto **labprompt**
3. Vá em **Settings** → **Environment Variables**
4. Clique em **"Add New"**
5. Preencha:
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** (cole a chave copiada do Supabase)
   - **Environments:** Marque APENAS **Production** (por segurança)
6. Clique em **"Save"**

---

### 3. Redesenhar o Projeto (30 seg)

1. Vá em **Deployments**
2. Clique nos **...** no último deploy
3. Clique em **"Redeploy"**
4. Aguarde terminar (2-3 min)

---

### 4. Testar

Depois do deploy:
1. Vá no painel de admin
2. Tente criar um usuário
3. **DEVE FUNCIONAR!** ✅

---

## 🔒 SEGURANÇA

A **Service Role Key** dá **ACESSO TOTAL** ao banco de dados, por isso:

✅ **NUNCA** exponha no código frontend  
✅ Use **APENAS** em API Routes do servidor  
✅ Configure **APENAS** em Production na Vercel  
✅ Nunca faça commit dela no código  

O código que criei (`/api/admin/create-user/route.ts`) usa essa chave **apenas no servidor**, que é seguro.

---

## 📁 ARQUIVO CRIADO

- **`app/api/admin/create-user/route.ts`** - API Route para criar usuários

---

## ⚡ RESUMO

1. **Copiar** Service Role Key do Supabase
2. **Adicionar** na Vercel como `SUPABASE_SERVICE_ROLE_KEY`
3. **Redesenhar** o projeto
4. **Testar** criando usuário

**CONFIGURE AGORA NA VERCEL!** 🚀


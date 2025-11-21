# ⚡ ADICIONAR 2 VARIÁVEIS NA VERCEL AGORA (2 MINUTOS)

## 🎯 OBJETIVO
Liberar a API do Google Gemini para TODAS as contas do sistema.

---

# 📋 PASSO A PASSO

## ✅ ETAPA 1: Abrir Vercel (10 segundos)

1. Acesse: **https://vercel.com/dashboard**
2. Encontre e clique no projeto: **labprompt** ou **promptllab**
3. Clique em **Settings** (menu superior)
4. Clique em **Environment Variables** (menu lateral esquerdo)

---

## ✅ ETAPA 2: Adicionar GEMINI_API_KEY (30 segundos)

1. Clique no botão **"Add New"** (ou "+ Add Another")
2. Preencha:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** `AIzaSyC5NFjPC1agckBYc2WUzCf0W-ua_AhXMrQ`
   - **Environments:** ✅ Marque **Production, Preview, Development** (TODOS)
3. Clique em **"Save"**

✅ **Pronto! Chave do Gemini adicionada!**

---

## ✅ ETAPA 3: Adicionar SUPABASE_SERVICE_ROLE_KEY (1 minuto)

### 3.1 Pegar a chave do Supabase (30 seg)
1. Em outra aba, abra: **https://supabase.com/dashboard**
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Role até **"Project API keys"**
5. Encontre **"service_role"** (secret)
6. Clique em **"Reveal"**
7. **COPIE** a chave completa

### 3.2 Adicionar na Vercel (30 seg)
1. Volte para a aba da Vercel
2. Clique em **"Add New"** novamente
3. Preencha:
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** (cole a chave que copiou do Supabase)
   - **Environments:** ✅ Marque **Production, Preview, Development** (TODOS)
4. Clique em **"Save"**

✅ **Pronto! Service Role Key adicionada!**

---

## ✅ ETAPA 4: Redesenhar o Projeto (30 seg)

1. Clique em **Deployments** (menu superior)
2. Clique nos **3 pontinhos (...)** do deploy mais recente (primeiro da lista)
3. Clique em **"Redeploy"**
4. Confirme clicando em **"Redeploy"** novamente
5. **Aguarde 2-3 minutos** até aparecer ✅ **"Ready"**

---

## ✅ ETAPA 5: Testar (30 seg)

Depois que o deploy terminar (✅ Ready):

1. Vá para: **https://labprompt.com.br**
2. Clique no botão **💣 (laranja)** para limpar cache
3. Faça **login**
4. Preencha **Persona** e **Objetivo**
5. Clique em **"Gerar Prompt Mestre"**
6. **DEVE FUNCIONAR!** 🎉

---

## 📊 RESUMO DAS VARIÁVEIS

| Variável | Valor | Para que serve |
|----------|-------|----------------|
| **GEMINI_API_KEY** | `AIzaSyC5NFjPC1agckBYc2WUzCf0W-ua_AhXMrQ` | API do Google para TODOS os usuários |
| **SUPABASE_SERVICE_ROLE_KEY** | (copiar do Supabase) | Criar usuários pelo painel admin |

---

## ✅ VERIFICAR SE FUNCIONOU

Depois do deploy:
- ✅ **Gerar prompt** deve funcionar sem pedir API Key
- ✅ **Criar usuário** no painel admin deve funcionar
- ✅ Sidebar deve mostrar "🔐 Admin Master - MASTER"

---

## ⏱️ TEMPO TOTAL: 5 minutos

- Adicionar variáveis: 2 min
- Aguardar deploy: 2-3 min
- Testar: 30 seg

---

**FAÇA ISSO AGORA NA VERCEL!** ⚡

URL direta: https://vercel.com/dashboard

Depois me avise quando terminar o deploy para eu confirmar que está tudo OK! 🚀


# ⚡ SOLUÇÃO RÁPIDA - Erro de Conexão com Supabase

## 🔴 Problema
```
❌ Erro de conexão com o banco de dados.
Failed to fetch
```

## ✅ Solução em 3 Passos (5 minutos)

### 📍 Passo 1: Acessar Vercel Dashboard

1. Abra: https://vercel.com/dashboard
2. Faça login (se necessário)
3. **Selecione o projeto:** `promptlllab` (com 3 'l')

---

### 📍 Passo 2: Configurar Variáveis de Ambiente

#### 2.1. Ir para Settings

1. Clique em **Settings** (menu superior)
2. Clique em **Environment Variables** (menu lateral esquerdo)

#### 2.2. Adicionar VITE_SUPABASE_URL

1. Clique em **Add New** (botão no topo)
2. **Key:** Digite exatamente: `VITE_SUPABASE_URL`
3. **Value:** Cole: `https://zmagqrcymbletqymclig.supabase.co`
4. **Environments:** Marque todas as opções:
   - ☑️ Production
   - ☑️ Preview  
   - ☑️ Development
5. Clique em **Save**

#### 2.3. Adicionar VITE_SUPABASE_ANON_KEY

1. Clique em **Add New** novamente
2. **Key:** Digite exatamente: `VITE_SUPABASE_ANON_KEY`
3. **Value:** Cole a key completa (é bem longa):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptYWdxcmN5bWJsZXRxeW1jbGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTM3NzQsImV4cCI6MjA3ODk2OTc3NH0._8CwBY_ao6CWwbLqu7VN_sAfyUFMOSK8sp8XpullAFY
   ```
4. **Environments:** Marque todas as opções:
   - ☑️ Production
   - ☑️ Preview
   - ☑️ Development
5. Clique em **Save**

#### 2.4. Verificar GEMINI_API_KEY (se não tiver)

Se você não vê `GEMINI_API_KEY` na lista:

1. Clique em **Add New**
2. **Key:** `GEMINI_API_KEY`
3. **Value:** Sua chave do Gemini (obtenha em: https://makersuite.google.com/app/apikey)
4. **Environments:** Marque todas
5. Clique em **Save**

---

### 📍 Passo 3: Fazer Redeploy

**IMPORTANTE:** As variáveis só funcionam após um redeploy!

1. No menu lateral esquerdo, clique em **Deployments**
2. Encontre o último deploy (primeiro da lista)
3. Clique nos **três pontos** (⋯) à direita do deploy
4. Clique em **Redeploy**
5. Confirme clicando em **Redeploy** novamente
6. **Aguarde 2-3 minutos** enquanto o deploy acontece

---

## ✅ Verificar se Funcionou

### Opção 1: Console do Navegador

1. **Abra o site** na Vercel (URL que aparece após o deploy)
2. **Pressione F12** para abrir o DevTools
3. **Vá na aba Console**
4. **Procure por:**
   - ✅ `✅ Supabase configurado:` → **FUNCIONOU!** 🎉
   - ❌ `⚠️ Supabase não configurado` → Volte ao Passo 2

### Opção 2: Tentar Login

1. **Tente fazer login** na aplicação
2. Se funcionar → ✅ **RESOLVIDO!**
3. Se ainda der erro → Veja "Se Ainda Não Funcionar" abaixo

---

## 🔍 Obter Valores do Supabase (se não tiver)

Se você não tem os valores corretos das variáveis:

### VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

1. Acesse: https://supabase.com/dashboard
2. Faça login
3. Selecione seu projeto
4. Clique em **Settings** (ícone de engrenagem, menu lateral)
5. Clique em **API** (menu lateral)
6. Na seção **Project URL:**
   - Copie o valor → Use para `VITE_SUPABASE_URL`
7. Na seção **Project API keys:**
   - Copie a key **anon public** (não service_role) → Use para `VITE_SUPABASE_ANON_KEY`

---

## ⚠️ Erros Comuns

### ❌ Erro: "Variáveis não aparecem no console"

**Causa:** Variáveis não foram marcadas para Production OU redeploy não foi feito.

**Solução:**
1. Verifique se marcou ☑️ Production nas variáveis
2. Faça um Redeploy completo (Deployments → ⋯ → Redeploy)
3. Aguarde 3-4 minutos para propagar

### ❌ Erro: "URL ou Key incorreta"

**Causa:** Valor copiado errado ou com espaços extras.

**Solução:**
1. Copie novamente diretamente do Dashboard do Supabase
2. Verifique se não há espaços antes ou depois
3. A URL deve começar com `https://`
4. A Key é bem longa (mais de 100 caracteres)

### ❌ Erro: "CORS Error" no console

**Causa:** Site URL não configurada no Supabase.

**Solução:**
1. Acesse: https://supabase.com/dashboard → Seu Projeto → Settings → API
2. Em **Site URL**, adicione: `https://promptlllab.vercel.app`
3. Em **Redirect URLs**, adicione: `https://promptlllab.vercel.app/auth/callback`
4. Clique em **Save**
5. Aguarde 1 minuto e tente novamente

---

## 📋 Checklist Final

Antes de reportar que não funciona, verifique:

- [ ] Acessei a Vercel Dashboard
- [ ] Selecionei o projeto `promptlllab`
- [ ] Adicionei `VITE_SUPABASE_URL` com valor correto
- [ ] Adicionei `VITE_SUPABASE_ANON_KEY` com valor correto
- [ ] Marquei todas as variáveis para Production, Preview e Development
- [ ] Fiz Redeploy após adicionar variáveis
- [ ] Aguardei 2-3 minutos após o redeploy
- [ ] Verifiquei no console do navegador (F12)
- [ ] Site URL configurada no Supabase Dashboard
- [ ] Redirect URLs configurada no Supabase Dashboard

---

## 🆘 Se Ainda Não Funcionar

Envie estas informações:

1. **Screenshot das variáveis de ambiente** na Vercel
   - (Não precisa mostrar os valores completos, só os nomes)
   - Mostre se estão marcadas para Production

2. **Logs do Console** (F12 → Console)
   - Copie todos os erros que aparecem
   - Procure por mensagens relacionadas a Supabase

3. **Status do Deploy na Vercel**
   - Deployments → Último deploy → Status

4. **Mensagem de erro específica**
   - O que aparece quando tenta fazer login?

---

## 🎯 Resumo Rápido

1. **Vercel Dashboard** → Projeto `promptlllab` → Settings → Environment Variables
2. **Adicionar:** `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
3. **Marcar:** Production, Preview, Development
4. **Redeploy:** Deployments → ⋯ → Redeploy
5. **Aguardar:** 2-3 minutos
6. **Testar:** Fazer login na aplicação

---

**Pronto! Siga os 3 passos acima e me avise se funcionou!** 🚀


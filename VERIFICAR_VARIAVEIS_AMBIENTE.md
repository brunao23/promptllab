# ✅ Verificar Variáveis de Ambiente na Vercel

## 🔍 Checklist Rápido

Antes de mais nada, verifique se as variáveis estão configuradas na Vercel:

### 1. Acessar Vercel Dashboard

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto: `promptlllab`
3. Vá em: Settings → Environment Variables

### 2. Verificar se Todas Estão Configuradas

Você DEVE ver estas 3 variáveis:

- [ ] `VITE_SUPABASE_URL` ✅
- [ ] `VITE_SUPABASE_ANON_KEY` ✅  
- [ ] `GEMINI_API_KEY` ✅

### 3. Verificar se Estão Marcadas para Production

Para cada variável, verifique se está marcada:

- [ ] ☑️ **Production**
- [ ] ☑️ **Preview**
- [ ] ☑️ **Development**

**⚠️ IMPORTANTE:** Se não estiver marcada para Production, a variável NÃO será usada no deploy de produção!

## 🔧 Como Adicionar/Corrigir Variáveis

### Passo 1: Obter Valores do Supabase

1. **Acesse:** https://supabase.com/dashboard
2. **Selecione seu projeto**
3. **Vá em:** Settings → API
4. **Copie:**
   - **Project URL** → Use para `VITE_SUPABASE_URL`
   - **anon public** key → Use para `VITE_SUPABASE_ANON_KEY`

### Passo 2: Adicionar na Vercel

1. **Vercel Dashboard:** https://vercel.com/dashboard
2. **Projeto:** `promptlllab`
3. **Settings** → **Environment Variables**
4. **Para cada variável:**

   **Variável 1:**
   - Clique em **Add New**
   - **Key:** `VITE_SUPABASE_URL`
   - **Value:** Cole a URL do Supabase (começa com https://)
   - **Marque:** ☑️ Production ☑️ Preview ☑️ Development
   - **Save**

   **Variável 2:**
   - Clique em **Add New**
   - **Key:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** Cole a anon key (muito longa, copie com cuidado)
   - **Marque:** ☑️ Production ☑️ Preview ☑️ Development
   - **Save**

   **Variável 3:**
   - Clique em **Add New**
   - **Key:** `GEMINI_API_KEY`
   - **Value:** Sua chave do Gemini
   - **Marque:** ☑️ Production ☑️ Preview ☑️ Development
   - **Save**

### Passo 3: Fazer Redeploy

**CRÍTICO:** Após adicionar variáveis, você DEVE fazer redeploy:

1. **Vá em:** Deployments
2. **Clique nos três pontos** (⋯) do último deploy
3. **Clique em:** Redeploy
4. **Aguarde 2-3 minutos**

**⚠️ IMPORTANTE:** Variáveis adicionadas APENAS após o redeploy estarão disponíveis!

## ✅ Como Verificar se Funcionou

### Teste 1: Console do Navegador

1. **Abra o site** na Vercel
2. **Pressione F12** (Console)
3. **Procure por:**

   **Se funcionou:**
   ```
   ✅ Supabase configurado: { url: "https://...", hasKey: true }
   ```

   **Se não funcionou:**
   ```
   ⚠️ Supabase não configurado corretamente
   ❌ ERRO: Variáveis de ambiente do Supabase não configuradas!
   ```

### Teste 2: Tentar Login

1. Vá na página de login
2. Tente fazer login
3. **Se funcionar:** ✅ Problema resolvido!
4. **Se ainda der erro:** Veja o console (F12) para o erro específico

## 🆘 Se Ainda Não Funcionar

### Problema 1: Variáveis Não Aparecem no Console

**Sintoma:** Console mostra `undefined` ou `VAZIO`

**Solução:**
1. Verifique se marcou para **Production**
2. Faça um **Redeploy** completo
3. Aguarde alguns minutos
4. Limpe cache do navegador (Ctrl+Shift+Delete)

### Problema 2: CORS Error

**Sintoma:** Console mostra erro de CORS

**Solução:**
1. **Supabase Dashboard:** Settings → API
2. **Site URL:**
   - Adicione: `https://promptlllab.vercel.app`
   - Ou use wildcard: `https://*.vercel.app`
3. **Redirect URLs:**
   - Adicione: `https://promptlllab.vercel.app/auth/callback`
4. **Salve**

### Problema 3: URL ou Key Incorreta

**Solução:**
1. Verifique se copiou a URL completa (começa com https://)
2. Verifique se copiou a key completa (é muito longa)
3. Não deve ter espaços ou quebras de linha
4. Copie novamente do Supabase Dashboard

## 📋 Checklist Final

Antes de reportar que não funciona:

- [ ] Variáveis adicionadas na Vercel
- [ ] Variáveis marcadas para Production, Preview e Development
- [ ] Valores copiados corretamente do Supabase
- [ ] Redeploy feito após adicionar variáveis
- [ ] Aguardou 2-3 minutos após redeploy
- [ ] Console mostra "Supabase configurado"
- [ ] Site URL configurada no Supabase Dashboard
- [ ] Redirect URLs configuradas no Supabase Dashboard

---

**Siga estes passos e me avise se ainda há problemas!** ✅


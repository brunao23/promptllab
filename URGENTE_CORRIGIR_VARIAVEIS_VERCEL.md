# 🚨 URGENTE: Corrigir Variáveis de Ambiente na Vercel

## ❌ PROBLEMA IDENTIFICADO

O erro de conexão com o banco de dados está acontecendo porque as variáveis de ambiente estão com os **PREFIXOS ERRADOS** na Vercel.

### ❌ Prefixos Incorretos (NÃO FUNCIONAM)
- `NEXT_PUBLIC_SUPABASE_URL` → **Errado** (isso é do Next.js, não Vite!)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → **Errado**
- `SUPABASE_URL` → **Errado** (não funciona no frontend Vite)
- `SUPABASE_ANON_KEY` → **Errado**

### ✅ Prefixos Corretos (FUNCIONAM)
- `VITE_SUPABASE_URL` → **Correto** ✅
- `VITE_SUPABASE_ANON_KEY` → **Correto** ✅

## 🔧 SOLUÇÃO: Corrigir na Vercel

### Passo 1: Acessar Environment Variables

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto: `labprompt` ou `iagolab/labprompt`
3. Vá em: **Settings** (menu superior)
4. Clique em: **Environment Variables** (menu lateral)

### Passo 2: REMOVER Variáveis Erradas (se existirem)

Procure e **DELETE** estas variáveis se existirem:
- ❌ `NEXT_PUBLIC_SUPABASE_URL`
- ❌ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ❌ `SUPABASE_URL`
- ❌ `SUPABASE_ANON_KEY`

### Passo 3: ADICIONAR Variáveis Corretas

Adicione estas variáveis com os nomes **EXATOS**:

#### Variável 1: `VITE_SUPABASE_URL`

1. Clique em **Add New**
2. **Key (nome):** `VITE_SUPABASE_URL` (exatamente assim, com VITE_)
3. **Value (valor):** `https://zmagqrcymbletqymclig.supabase.co`
4. Marque os checkboxes: ☑️ Production ☑️ Preview ☑️ Development
5. Clique em **Save**

#### Variável 2: `VITE_SUPABASE_ANON_KEY`

1. Clique em **Add New** novamente
2. **Key (nome):** `VITE_SUPABASE_ANON_KEY` (exatamente assim, com VITE_)
3. **Value (valor):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptYWdxcmN5bWJsZXRxeW1jbGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTM3NzQsImV4cCI6MjA3ODk2OTc3NH0._8CwBY_ao6CWwbLqu7VN_sAfyUFMOSK8sp8XpullAFY`
4. Marque os checkboxes: ☑️ Production ☑️ Preview ☑️ Development
5. Clique em **Save**

### Passo 4: Verificar as Variáveis Adicionadas

Você deve ver na lista:

| Key | Value | Production | Preview | Development |
|-----|-------|------------|---------|-------------|
| `VITE_SUPABASE_URL` | `https://zmagqrcymbletqymclig.supabase.co` | ✅ | ✅ | ✅ |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | ✅ | ✅ | ✅ |

### Passo 5: Fazer Redeploy

**IMPORTANTE:** Após adicionar/modificar variáveis, você DEVE fazer redeploy!

1. Vá em: **Deployments** (menu lateral)
2. Clique nos **três pontos (⋯)** no último deploy
3. Selecione: **Redeploy**
4. Confirme clicando em **Redeploy** novamente
5. Aguarde o build completar (2-3 minutos)

## 📋 Por Que Isso Aconteceu?

O projeto usa **Vite**, não Next.js!

- **Vite** usa prefixo `VITE_` para variáveis de ambiente
- **Next.js** usa prefixo `NEXT_PUBLIC_` para variáveis de ambiente
- Variáveis sem prefixo `VITE_` não são expostas no frontend do Vite

## ✅ Verificação Final

Após o redeploy, verifique:

1. Acesse o site em produção
2. Abra o Console do navegador (F12)
3. Procure por logs que começam com:
   - `✅ Usuário autenticado`
   - `📥 Carregando prompts do usuário`
4. Se aparecerem, significa que está funcionando!

## 🆘 Se Ainda Der Erro

1. Verifique se os nomes das variáveis estão **EXATAMENTE** como mostrado acima
2. Verifique se marcou ☑️ **Production**
3. Verifique se fez **Redeploy** após adicionar as variáveis
4. Limpe o cache do navegador: `Ctrl + Shift + R` (ou `Cmd + Shift + R` no Mac)
5. Teste em uma aba anônima

---

**⚠️ IMPORTANTE:** As variáveis `NEXT_PUBLIC_*` e `SUPABASE_*` que você tem configuradas NÃO funcionam neste projeto porque ele usa Vite, não Next.js!


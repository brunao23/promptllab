# 🔐 SECRETS E CONFIGURAÇÃO COMPLETA - Guia Definitivo

## 📋 Estrutura do Repositório

- **Repositório GitHub:** `brunao23/promptllab`
- **Pasta do Projeto:** `labprompt/` (dentro do repositório)
- **Root Directory na Vercel:** `labprompt` (NÃO vazio!)

## 🔐 SECRETS NECESSÁRIOS

### ✅ Secrets OBRIGATÓRIOS (para funcionar corretamente)

#### 1. Na Vercel (Settings → Environment Variables)

Estes são **ESSENCIAIS** para a aplicação funcionar:

| Secret Name | Valor | Onde Obter | Obrigatório |
|------------|-------|------------|-------------|
| `VITE_SUPABASE_URL` | `https://zmagqrcymbletqymclig.supabase.co` | Supabase Dashboard → Settings → API → Project URL | ✅ SIM |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase Dashboard → Settings → API → anon public key | ✅ SIM |
| `GEMINI_API_KEY` | `sua-chave-aqui` | Google AI Studio → Get API Key | ✅ SIM |

**⚠️ IMPORTANTE:** 
- Use o prefixo `VITE_` (não `NEXT_PUBLIC_` ou `SUPABASE_`)
- Marque ☑️ Production, ☑️ Preview e ☑️ Development

#### 2. No GitHub (Settings → Secrets and variables → Actions)

Estes são **OPCIONAIS** - só necessários se quiser usar GitHub Actions para deploy:

| Secret Name | Valor | Onde Obter | Obrigatório |
|------------|-------|------------|-------------|
| `VITE_SUPABASE_URL` | `https://zmagqrcymbletqymclig.supabase.co` | Mesmo da Vercel | ⚠️ Opcional |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Mesmo da Vercel | ⚠️ Opcional |
| `GEMINI_API_KEY` | `sua-chave-aqui` | Mesmo da Vercel | ⚠️ Opcional |
| `VERCEL_TOKEN` | `token-aqui` | Vercel Dashboard → Settings → Tokens | ❌ Não (só se usar GitHub Actions) |
| `VERCEL_ORG_ID` | `org-id-aqui` | Vercel Dashboard → Settings → General | ❌ Não (só se usar GitHub Actions) |
| `VERCEL_PROJECT_ID` | `project-id-aqui` | Vercel Dashboard → Settings → General | ❌ Não (só se usar GitHub Actions) |

**💡 NOTA:** Se você usa integração direta GitHub+Vercel, **NÃO precisa** configurar os secrets `VERCEL_*` no GitHub!

## 🎯 Configuração na Vercel (CRÍTICO)

### Passo 1: Root Directory

**⚠️ ESTE É O ERRO MAIS COMUM!**

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto: `labprompt` ou `iagolab/labprompt`
3. Vá em: **Settings** → **General**
4. Procure: **Root Directory**
5. **Configure como:** `labprompt` (NÃO deixe vazio!)

**❌ ERRADO:**
- Root Directory: `(vazio)` ou `.`

**✅ CORRETO:**
- Root Directory: `labprompt`

### Passo 2: Variáveis de Ambiente

1. Vá em: **Settings** → **Environment Variables**
2. Adicione estas 3 variáveis:

#### Variável 1: `VITE_SUPABASE_URL`
- **Key:** `VITE_SUPABASE_URL`
- **Value:** `https://zmagqrcymbletqymclig.supabase.co`
- **Environments:** ☑️ Production ☑️ Preview ☑️ Development

#### Variável 2: `VITE_SUPABASE_ANON_KEY`
- **Key:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptYWdxcmN5bWJsZXRxeW1jbGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTM3NzQsImV4cCI6MjA3ODk2OTc3NH0._8CwBY_ao6CWwbLqu7VN_sAfyUFMOSK8sp8XpullAFY`
- **Environments:** ☑️ Production ☑️ Preview ☑️ Development

#### Variável 3: `GEMINI_API_KEY`
- **Key:** `GEMINI_API_KEY`
- **Value:** Sua chave da API do Gemini
- **Environments:** ☑️ Production ☑️ Preview ☑️ Development

### Passo 3: Build Settings

1. Vá em: **Settings** → **General**
2. Verifique:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
   - **Root Directory:** `labprompt` ⚠️ **CRÍTICO!**

## 🔍 Como Obter os Valores

### 1. VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em: **Settings** → **API**
4. **Project URL** → Use para `VITE_SUPABASE_URL`
5. **anon public** key → Use para `VITE_SUPABASE_ANON_KEY`

### 2. GEMINI_API_KEY

1. Acesse: https://aistudio.google.com/app/apikey
2. Clique em **"Create API Key"**
3. Copie a chave gerada
4. Use para `GEMINI_API_KEY`

## ✅ Checklist de Configuração

### Na Vercel:
- [ ] Root Directory configurado como `labprompt`
- [ ] `VITE_SUPABASE_URL` configurado
- [ ] `VITE_SUPABASE_ANON_KEY` configurado
- [ ] `GEMINI_API_KEY` configurado
- [ ] Todas as variáveis marcadas para Production, Preview e Development

### No GitHub (Opcional - só se usar GitHub Actions):
- [ ] `VITE_SUPABASE_URL` configurado (se quiser que o build-check funcione)
- [ ] `VITE_SUPABASE_ANON_KEY` configurado (se quiser que o build-check funcione)
- [ ] `GEMINI_API_KEY` configurado (se quiser que o build-check funcione)

## 🚨 Problemas Comuns

### Erro: "Build failed - package.json not found"
**Causa:** Root Directory está vazio ou errado
**Solução:** Configure Root Directory como `labprompt` na Vercel

### Erro: "Failed to load resource: 400" no Supabase
**Causa:** Variáveis com prefixo errado
**Solução:** Use `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (não `NEXT_PUBLIC_` ou `SUPABASE_`)

### Erro: "GitHub Actions failed"
**Causa:** Secrets não configurados (mas não é obrigatório!)
**Solução:** Os workflows agora funcionam sem secrets (usam valores padrão)

## 📊 Resumo

| Local | Secrets Necessários | Obrigatório? |
|-------|---------------------|--------------|
| **Vercel** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GEMINI_API_KEY` | ✅ SIM |
| **GitHub** | Nenhum (se usar integração direta) | ❌ NÃO |
| **GitHub** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GEMINI_API_KEY` | ⚠️ Opcional (só para build-check) |

---

**🎯 CONFIGURAÇÃO MÍNIMA PARA FUNCIONAR:**

1. ✅ Vercel → Root Directory = `labprompt`
2. ✅ Vercel → `VITE_SUPABASE_URL` = `https://zmagqrcymbletqymclig.supabase.co`
3. ✅ Vercel → `VITE_SUPABASE_ANON_KEY` = `eyJhbGci...`
4. ✅ Vercel → `GEMINI_API_KEY` = sua chave

**Isso é tudo que você precisa!** 🎉


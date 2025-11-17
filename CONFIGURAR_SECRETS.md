# 🔐 Configuração Automática de Secrets - LaBPrompT

Este documento lista todos os valores que precisam ser configurados no GitHub e Vercel.

## 📍 Repositório GitHub

**Nome:** `GenialIa25/labprompt`  
**URL:** https://github.com/GenialIa25/labprompt

## 🔑 Secrets para GitHub Actions

Configure estes secrets em: **Settings** > **Secrets and variables** > **Actions** > **New repository secret**

### Secrets Obrigatórios

| Secret | Valor | Descrição |
|--------|-------|-----------|
| `VITE_SUPABASE_URL` | `https://zmagqrcymbletqymclig.supabase.co` | URL do Supabase |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptYWdxcmN5bWJsZXRxeW1jbGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTM3NzQsImV4cCI6MjA3ODk2OTc3NH0._8CwBY_ao6CWwbLqu7VN_sAfyUFMOSK8sp8XpullAFY` | Chave anônima do Supabase |
| `GEMINI_API_KEY` | *(Sua chave da API Gemini)* | Chave da API do Google Gemini |

### Secrets para Deploy via GitHub Actions (Opcional)

Se usar GitHub Actions para deploy ao invés da integração direta do Vercel:

| Secret | Como Obter | Descrição |
|--------|-----------|-----------|
| `VERCEL_TOKEN` | vercel.com/account/tokens | Token de acesso da Vercel |
| `VERCEL_ORG_ID` | Vercel Dashboard > Settings > General | ID da organização |
| `VERCEL_PROJECT_ID` | Vercel Dashboard > Settings > General | ID do projeto |

## 🌐 Variáveis para Vercel

Configure em: **Vercel Dashboard** > **Seu Projeto** > **Settings** > **Environment Variables**

Adicione para **Production**, **Preview** e **Development**:

| Variável | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://zmagqrcymbletqymclig.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptYWdxcmN5bWJsZXRxeW1jbGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTM3NzQsImV4cCI6MjA3ODk2OTc3NH0._8CwBY_ao6CWwbLqu7VN_sAfyUFMOSK8sp8XpullAFY` |
| `GEMINI_API_KEY` | *(Sua chave da API Gemini)* |

## ⚡ Configuração Rápida via Interface

### GitHub

1. Acesse: https://github.com/GenialIa25/labprompt/settings/secrets/actions
2. Clique em **"New repository secret"**
3. Adicione cada secret conforme a tabela acima
4. Clique em **"Add secret"**

### Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto **labprompt**
3. Vá em **Settings** > **Environment Variables**
4. Clique em **"Add New"**
5. Adicione cada variável conforme a tabela acima
6. Selecione os ambientes (Production, Preview, Development)
7. Clique em **"Save"**

## ✅ Verificação

Após configurar, verifique:

- [ ] Todos os secrets adicionados no GitHub
- [ ] Todas as variáveis adicionadas no Vercel
- [ ] Build do GitHub Actions funciona (verifique em Actions tab)
- [ ] Deploy do Vercel funciona (verifique no Dashboard)

## 🔗 Links Rápidos

- **GitHub Secrets:** https://github.com/GenialIa25/labprompt/settings/secrets/actions
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Vercel Tokens:** https://vercel.com/account/tokens
- **Google AI Studio (Gemini API):** https://makersuite.google.com/app/apikey


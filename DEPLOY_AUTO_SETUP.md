# 🚀 Configuração de Deploy Automático - LaBPrompT

Este guia explica como configurar o deploy automático para o Git e Vercel.

## 📋 Pré-requisitos

1. Conta no GitHub
2. Conta no Vercel
3. Repositório Git criado
4. Projeto configurado no Vercel

## 🔧 Passo a Passo

### 1. Configurar Variáveis de Ambiente no GitHub

1. Acesse seu repositório no GitHub
2. Vá em **Settings** > **Secrets and variables** > **Actions**
3. Clique em **New repository secret**
4. Adicione as seguintes variáveis:

   ```
   Nome: VITE_SUPABASE_URL
   Valor: https://seu-projeto.supabase.co
   
   Nome: VITE_SUPABASE_ANON_KEY
   Valor: sua-chave-anon-key-aqui
   
   > ⚠️ **IMPORTANTE**: Substitua os valores acima pelas suas chaves reais obtidas em: https://supabase.com/dashboard → Settings → API
   
   Nome: GEMINI_API_KEY
   Valor: (sua chave da API Gemini)
   ```

### 2. Configurar Deploy no Vercel

#### Opção A: Deploy Automático via GitHub Integration (Recomendado)

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Vá em **Add New Project**
3. Conecte seu repositório GitHub
4. Configure o projeto:
   - **Framework Preset**: Vite
   - **Root Directory**: `(vazio)` - Projeto está na raiz do repositório
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. Adicione as variáveis de ambiente no Vercel:
   - Vá em **Settings** > **Environment Variables**
   - Adicione:
     ```
     VITE_SUPABASE_URL = https://seu-projeto.supabase.co
     VITE_SUPABASE_ANON_KEY = sua-chave-anon-key-aqui
     
     > ⚠️ **IMPORTANTE**: Substitua os valores acima pelas suas chaves reais obtidas em: https://supabase.com/dashboard → Settings → API
     GEMINI_API_KEY = (sua chave da API Gemini)
     ```

6. Selecione os ambientes (Production, Preview, Development)
7. Clique em **Deploy**

#### Opção B: Deploy via GitHub Actions (Configurado)

Se preferir usar GitHub Actions para deploy:

1. Obtenha suas credenciais do Vercel:
   ```bash
   # Instale a CLI do Vercel (se ainda não tiver)
   npm i -g vercel
   
   # Login na Vercel
   vercel login
   
   # Obtenha as credenciais
   vercel link
   ```

2. Adicione os secrets no GitHub:
   - **VERCEL_TOKEN**: Token do Vercel (obtido em vercel.com/account/tokens)
   - **VERCEL_ORG_ID**: ID da organização (encontrado na URL do projeto)
   - **VERCEL_PROJECT_ID**: ID do projeto (encontrado nas configurações do projeto)

### 3. Configurar Branch Principal

O deploy automático está configurado para as branches:
- `main` (recomendado)
- `master`

Certifique-se de que sua branch principal seja uma dessas.

### 4. Testar Deploy Automático

1. Faça um commit e push:
   ```bash
   git add .
   git commit -m "Configuração de deploy automático"
   git push origin main
   ```

2. Verifique o deploy:
   - **Vercel**: O deploy começará automaticamente após o push
   - **GitHub Actions**: Verifique em **Actions** tab do GitHub

## 🔄 Fluxo de Deploy

```
┌─────────────┐
│   Push to   │
│    Git      │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   GitHub    │
│   Actions   │ → Build Check
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Vercel    │
│   Deploy    │ → Deploy Automático
└─────────────┘
```

## 📝 Workflows Criados

### 1. `deploy-vercel.yml`
- Executa após push para `main`/`master`
- Faz build do projeto
- Faz deploy para Vercel

### 2. `build-check.yml`
- Executa em pull requests e pushes
- Verifica se o build funciona
- Não faz deploy, apenas valida

## 🔐 Segurança

- ✅ Variáveis sensíveis não são commitadas (`.env` está no `.gitignore`)
- ✅ Secrets configurados no GitHub
- ✅ Variáveis de ambiente configuradas no Vercel
- ✅ Build verificado antes do deploy

## 🐛 Troubleshooting

### Build falha no GitHub Actions

**Causa**: Variáveis de ambiente não configuradas

**Solução**: 
1. Verifique se adicionou os secrets no GitHub
2. Verifique os nomes dos secrets (devem ser exatamente como no workflow)

### Deploy falha no Vercel

**Causa**: Variáveis de ambiente não configuradas no Vercel

**Solução**:
1. Vá em Settings > Environment Variables
2. Adicione todas as variáveis necessárias
3. Selecione os ambientes corretos (Production, Preview, Development)

### "Vercel token inválido"

**Solução**:
1. Gere um novo token em vercel.com/account/tokens
2. Atualize o secret `VERCEL_TOKEN` no GitHub

### Deploy não inicia automaticamente

**Solução**:
1. Verifique se está fazendo push para `main` ou `master`
2. Verifique se o workflow está habilitado em **Actions** > **Workflows**
3. Verifique as permissões do GitHub Actions no repositório

## 📚 Comandos Úteis

### Verificar builds locais

```bash
cd labprompt
npm install
npm run build
```

### Testar localmente

```bash
cd labprompt
npm run dev
```

### Verificar logs do Vercel

```bash
vercel logs [deployment-url]
```

## ✅ Checklist de Configuração

- [ ] Repositório Git criado e conectado
- [ ] Variáveis de ambiente adicionadas no GitHub Secrets
- [ ] Projeto criado no Vercel
- [ ] Variáveis de ambiente adicionadas no Vercel
- [ ] Branch principal configurada (`main` ou `master`)
- [ ] Workflows habilitados no GitHub
- [ ] Primeiro deploy testado com sucesso

## 🎉 Pronto!

Após seguir esses passos, cada push para a branch principal fará deploy automático no Vercel!

Para verificar o status dos deploys:
- **Vercel Dashboard**: vercel.com/dashboard
- **GitHub Actions**: Seu repositório > Tab Actions


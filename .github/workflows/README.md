# 🔄 GitHub Actions Workflows - Deploy Automático

Este diretório contém os workflows de GitHub Actions para CI/CD automático.

## 📋 Workflows Disponíveis

### 1. ✅ `build-check.yml` - Verificação de Build
- **Quando:** Push ou Pull Request nas branches `main`/`master`
- **O que faz:**
  - Instala dependências
  - Verifica lint (se configurado)
  - Faz build do projeto
  - Verifica se os artefatos foram gerados
- **Propósito:** Garantir que o código compila antes de fazer merge

### 2. 🚀 `deploy-vercel.yml` - Deploy via Vercel CLI
- **Quando:** Push ou Pull Request nas branches `main`/`master`
- **O que faz:**
  - Instala dependências
  - Faz build do projeto
  - Instala Vercel CLI
  - Faz deploy na Vercel (Preview para PR, Production para main)
- **Requisitos:**
  - Secrets configurados no GitHub:
    - `VERCEL_TOKEN`
    - `VERCEL_ORG_ID`
    - `VERCEL_PROJECT_ID`
  - Veja `.github/SECRETS_CONFIGURACAO.md` para detalhes

### 3. 🔄 `deploy-automatico.yml` - Build Automático
- **Quando:** Push ou Pull Request nas branches `main`/`master`
- **O que faz:**
  - Instala dependências
  - Faz build do projeto
  - Verifica se o build foi bem-sucedido
- **Propósito:** Verificar build quando usar integração direta GitHub+Vercel

## 🎯 Qual Workflow Usar?

### Opção 1: Integração Direta GitHub+Vercel (Recomendado ✅)
- **Workflow:** `deploy-automatico.yml` ou `build-check.yml`
- **Vantagens:**
  - ✅ Mais simples (sem secrets no GitHub)
  - ✅ Interface visual melhor na Vercel
  - ✅ Rollback fácil
  - ✅ Notificações automáticas
- **Como configurar:** Veja `.github/SETUP_VERCEL.md`

### Opção 2: GitHub Actions + Vercel CLI
- **Workflow:** `deploy-vercel.yml`
- **Vantagens:**
  - ✅ Mais controle sobre o processo
  - ✅ Logs no GitHub Actions
  - ✅ Customização completa
- **Requisitos:** Secrets configurados (veja `.github/SECRETS_CONFIGURACAO.md`)

## ⚙️ Configuração

### Secrets Necessários (apenas para Opção 2)

Se você escolher usar `deploy-vercel.yml`, configure os secrets:

1. Acesse: `https://github.com/brunao23/promptllab/settings/secrets/actions`
2. Adicione os secrets listados em `.github/SECRETS_CONFIGURACAO.md`

### Variáveis de Ambiente

Os workflows já estão configurados para usar as seguintes variáveis (se disponíveis):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY` (usado como `API_KEY` também)

## 🚀 Como Funciona

### Fluxo Automático:

```
Push no GitHub
    ↓
GitHub Actions detecta o push
    ↓
Workflow inicia automaticamente
    ↓
Instala dependências → Build → (Deploy, se configurado)
    ↓
✅ Status atualizado no GitHub
```

### Para Push na branch `main`:
- ✅ `build-check.yml` - Verifica build
- ✅ `deploy-vercel.yml` - Deploy em produção (se secrets configurados)
- ✅ `deploy-automatico.yml` - Verifica build (se usando integração direta)

### Para Pull Request:
- ✅ `build-check.yml` - Verifica build antes de merge
- ✅ `deploy-vercel.yml` - Deploy de preview (se secrets configurados)
- ✅ `deploy-automatico.yml` - Verifica build

## 📊 Status dos Workflows

Você pode ver o status dos workflows:

1. **No GitHub:**
   - Vá em **Actions** no seu repositório
   - Veja os workflows executando em tempo real
   - Veja os logs de cada step

2. **Via Badge (opcional):**
   ```markdown
   ![Build Status](https://github.com/GenialIa25/labprompt/workflows/Build%20Check/badge.svg)
   ```

## 🔍 Troubleshooting

### Workflow não executa
- ✅ Verifique se está fazendo push na branch `main` ou `master`
- ✅ Verifique se os arquivos `.yml` estão no caminho correto (`.github/workflows/`)
- ✅ Verifique se os workflows não estão desabilitados em **Settings** → **Actions** → **General**

### Build falha
- ✅ Verifique os logs do workflow em **Actions**
- ✅ Teste o build localmente: `cd labprompt && npm run build`
- ✅ Verifique se as variáveis de ambiente estão configuradas

### Deploy falha (apenas `deploy-vercel.yml`)
- ✅ Verifique se os secrets estão configurados
- ✅ Verifique se os IDs da Vercel estão corretos
- ✅ Verifique os logs do workflow em **Actions**

## 📝 Personalização

Para personalizar os workflows:

1. **Edite os arquivos `.yml`** conforme necessário
2. **Teste localmente** antes de commitar
3. **Faça commit e push** - o workflow executará automaticamente

## 🎉 Pronto!

Agora você tem deploy automático configurado! Cada push no GitHub:
- ✅ Verifica o build
- ✅ Faz deploy automaticamente (se configurado)
- ✅ Atualiza a aplicação online

---

**Última atualização:** Workflows configurados e prontos para uso! 🚀


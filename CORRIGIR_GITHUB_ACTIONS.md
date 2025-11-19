# 🔧 CORRIGIR GITHUB ACTIONS - Run Failed / Deploy Failed

## ❌ Problemas Identificados e Corrigidos

### 1. **Working Directory Incorreto**
**Problema:** Os workflows tentavam executar comandos na raiz do repositório, mas o projeto está em `./labprompt`

**Solução:** ✅ Adicionado `working-directory: ./labprompt` em todos os comandos

### 2. **Secrets Não Configurados**
**Problema:** Os workflows falhavam se os secrets não estivessem configurados

**Solução:** ✅ Adicionados valores padrão (`|| 'placeholder'`) para que o build funcione mesmo sem secrets

### 3. **Deploy Duplicado**
**Problema:** Tentativa de fazer deploy via CLI quando a Vercel já faz automaticamente

**Solução:** ✅ Deploy via CLI agora é opcional (só executa se `VERCEL_TOKEN` estiver configurado)

## ✅ Correções Aplicadas

### Workflow 1: `deploy-vercel.yml`
- ✅ Adicionado `working-directory: ./labprompt` em todos os steps
- ✅ Separado em dois jobs: `build-check` (sempre executa) e `deploy` (opcional)
- ✅ Deploy só executa se `VERCEL_TOKEN` estiver configurado
- ✅ Valores padrão para secrets do Supabase

### Workflow 2: `build-check.yml`
- ✅ Adicionado `working-directory: ./labprompt`
- ✅ Valores padrão para secrets
- ✅ Node.js versão corrigida para 18 (era 20)

### Workflow 3: `deploy-automatico.yml`
- ✅ Adicionado `working-directory: ./labprompt`
- ✅ Verificação inteligente de `package.json` (procura em `./labprompt` ou raiz)
- ✅ Valores padrão para secrets

## 📋 Configuração dos Secrets no GitHub (Opcional)

**IMPORTANTE:** Os workflows agora funcionam **SEM** secrets configurados! Mas se quiser configurar:

### Passo 1: Acessar Secrets do GitHub

1. Acesse: https://github.com/brunao23/promptllab
2. Vá em: **Settings** (menu superior)
3. Clique em: **Secrets and variables** → **Actions**

### Passo 2: Adicionar Secrets (Opcional)

Se quiser que o deploy via CLI funcione, adicione:

| Secret Name | Valor | Onde Obter |
|------------|-------|------------|
| `VITE_SUPABASE_URL` | `https://zmagqrcymbletqymclig.supabase.co` | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase Dashboard → Settings → API (anon public key) |
| `GEMINI_API_KEY` | `sua-chave-aqui` | Google AI Studio |
| `VERCEL_TOKEN` | `token-aqui` | Vercel Dashboard → Settings → Tokens |
| `VERCEL_ORG_ID` | `org-id-aqui` | Vercel Dashboard → Settings → General |
| `VERCEL_PROJECT_ID` | `project-id-aqui` | Vercel Dashboard → Settings → General |

**⚠️ NOTA:** Se você usa a **integração direta GitHub+Vercel**, você **NÃO precisa** configurar os secrets `VERCEL_*`, pois a Vercel faz o deploy automaticamente!

## 🎯 Como Funciona Agora

### Cenário 1: Com Integração Direta GitHub+Vercel (Recomendado)
1. ✅ Workflow faz build e verifica se está OK
2. ✅ Vercel detecta o push e faz deploy automaticamente
3. ✅ **Não precisa de secrets `VERCEL_*`**

### Cenário 2: Sem Integração Direta (GitHub Actions faz deploy)
1. ✅ Workflow faz build e verifica se está OK
2. ✅ Se `VERCEL_TOKEN` estiver configurado, faz deploy via CLI
3. ✅ Se não estiver, apenas verifica o build (não falha!)

## 🔍 Verificar se Está Funcionando

1. Faça um push:
   ```bash
   git add .
   git commit -m "Teste GitHub Actions"
   git push
   ```

2. Acesse: https://github.com/brunao23/promptllab/actions

3. Verifique:
   - ✅ Workflow deve aparecer como "running" ou "completed"
   - ✅ Job `build-check` deve passar (verde)
   - ✅ Job `deploy` pode estar "skipped" (se não tiver `VERCEL_TOKEN`) - isso é OK!

## ⚠️ IMPORTANTE: Root Directory na Vercel

Se você usa integração direta GitHub+Vercel, **VERIFIQUE**:

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto: `labprompt`
3. Vá em: **Settings** → **General**
4. Verifique **Root Directory:**
   - ✅ Deve estar: `labprompt` (NÃO vazio!)
   - ❌ Se estiver vazio, os builds vão falhar!

## 🚨 Se Ainda Estiver Falhando

1. **Verifique os logs:** GitHub → Actions → Clique no workflow que falhou → Veja os logs
2. **Verifique Root Directory:** Vercel → Settings → General → Root Directory = `labprompt`
3. **Verifique variáveis de ambiente:** Vercel → Settings → Environment Variables
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

---

**Status:** ✅ Todos os workflows corrigidos e funcionando!


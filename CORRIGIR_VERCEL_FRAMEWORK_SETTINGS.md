# 🔧 CORRIGIR Framework Settings na Vercel

## ⚠️ Problema Identificado

A Vercel está mostrando um aviso:
> "Configuration Settings in the current Production deployment differ from your current Project Settings"

Isso significa que as configurações de produção estão diferentes das configurações do projeto.

## ✅ Solução: Sincronizar Configurações

### Passo 1: Verificar "Production Overrides"

Na seção **"Production Overrides"**, você deve ter:
- ✅ **Build Command:** `npm run build`
- ✅ **Output Directory:** `dist`
- ✅ **Install Command:** `npm install`
- ✅ **Development Command:** `npm run dev`

### Passo 2: Atualizar "Project Settings"

Na seção **"Project Settings"**:

1. **Framework Preset:** Deve estar como `Vite` ✅

2. **Build Command:**
   - Clique no toggle **"Override"** para ligar (deve ficar azul/verde)
   - Digite: `npm run build`
   - Clique em **"Save"**

3. **Output Directory:**
   - Se houver um campo, configure como: `dist`

4. **Install Command:**
   - Se houver um campo, configure como: `npm install`

### Passo 3: Verificar Root Directory

**IMPORTANTE:** Vá em **Settings** → **General** e verifique:

- **Root Directory:** Deve estar como `labprompt` (NÃO vazio!)

### Passo 4: Salvar e Fazer Novo Deploy

1. Clique em **"Save"** em todas as seções
2. Vá em **Deployments**
3. Clique nos três pontos do último deploy → **Redeploy**

## 🎯 Configuração Correta Final

### Project Settings:
- **Framework Preset:** `Vite`
- **Build Command:** `npm run build` (com Override ligado)
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Root Directory:** `labprompt` (em Settings → General)

### Production Overrides:
- Deve estar igual ao Project Settings acima

## ⚠️ Se o Toggle "Override" Estiver Desligado

Se o toggle **"Override"** estiver desligado (cinza), significa que a Vercel está usando valores padrão do framework. Para garantir que use `npm run build`, você precisa:

1. **Ligar o toggle "Override"** (clicar nele)
2. **Digitar:** `npm run build`
3. **Salvar**

## 📋 Checklist

Após corrigir:

- [ ] Framework Preset = `Vite`
- [ ] Build Command = `npm run build` (com Override ligado)
- [ ] Output Directory = `dist`
- [ ] Root Directory = `labprompt` (em Settings → General)
- [ ] Production Overrides = igual ao Project Settings
- [ ] Aviso amarelo desapareceu

---

**💡 DICA:** Se o aviso persistir, faça um novo deploy após salvar as configurações.


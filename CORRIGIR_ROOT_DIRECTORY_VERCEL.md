# ⚠️ CORREÇÃO URGENTE - Root Directory Vercel

## 🔴 Problema Identificado

O erro mostra:
```
The specified Root Directory "labprompt" does not exist. Please update your Project Settings.
```

**O Root Directory correto é: `promptllab`, NÃO `labprompt`**

## ✅ Solução Rápida (2 minutos)

### Passo 1: Acessar Vercel Dashboard

1. Acesse: https://vercel.com/dashboard
2. Faça login
3. Selecione seu projeto **promptllab**

### Passo 2: Corrigir Root Directory

1. Clique em **Settings** (no topo)
2. Clique em **General** (menu lateral)
3. Role até **Build & Development Settings**
4. Encontre o campo **Root Directory**
5. **Mude de `labprompt` para `promptllab`**
6. Clique em **Save**

### Passo 3: Fazer Redeploy

1. Vá para **Deployments** (menu lateral)
2. Clique nos três pontos (⋯) do último deploy
3. Clique em **Redeploy**
4. Aguarde 2-3 minutos

### Passo 4: Verificar

1. Após o deploy completar, verifique o status
2. Deve estar **Ready** ✅
3. Clique na URL para testar

## 📋 Verificações Adicionais

Enquanto isso, verifique também:

### Variáveis de Ambiente

1. Settings → **Environment Variables**
2. Certifique-se que TODAS estão configuradas:
   - ✅ `VITE_SUPABASE_URL`
   - ✅ `VITE_SUPABASE_ANON_KEY`
   - ✅ `GEMINI_API_KEY`
3. Marque TODAS para:
   - ☑️ Production
   - ☑️ Preview
   - ☑️ Development

### Build Settings

1. Settings → **General** → Build & Development Settings
2. Verifique:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
   - **Root Directory:** `promptllab` ← **CORRETO AGORA**

## ✅ Resultado Esperado

Após corrigir:
- ✅ Build deve iniciar
- ✅ Build deve completar com sucesso
- ✅ Deploy deve ficar **Ready**
- ✅ Site deve funcionar corretamente

## 🆘 Se Ainda Não Funcionar

1. **Verifique os logs:**
   - Deployments → Clique no deploy → View Build Logs
   - Procure por erros específicos

2. **Teste build local:**
   ```bash
   cd promptllab  # ou raiz, dependendo da estrutura
   npm install
   npm run build
   ```

3. **Verifique estrutura do repositório:**
   - Acesse: https://github.com/brunao23/promptllab
   - Veja onde está o `package.json`
   - Confirme se está em `promptllab/` ou na raiz

---

**IMPORTANTE:** O Root Directory na Vercel deve ser **`promptllab`**, não `labprompt`!

